# Mechanic mobile API (inbox, cases, disputes) — prompt for the CRM repo

Sixth of the mechanic-app prompts. Needs Tasks 64–68 in.

> Read `/Users/bradfarrington/Downloads/bmt-mechanic-app/docs/inbox-crm-prompt.md`
> and do everything below the horizontal rule in it.

---

## Context

The app's Inbox tab is one feed — customer messages, things that happened to
the mechanic's jobs, disputes, Get-help cases, payouts, reviews, expiring
documents — with unread dots and "Mark all read". From it the mechanic opens a
message thread (built), a dispute, or a case, and can raise a new case.

Reads the app does itself under RLS: `disputes`, `dispute_messages`,
`resolution_reasons`, `resolution_cases`, `resolution_messages`. Everything else
here needs the server. House pattern as before (`readJsonBody` →
`mobileMechanicCaller(request, family)` → shared `lib/` core with the caller
passed in → `refusalResponse` / `apiOk`); **refusals are non-2xx `{ error }`**
like every mechanic route, even where the customer twin answers 200
`{ ok: false }`. **Keep the paths, field names and shapes, or tell me what you
changed.** All paths are under `/api/mobile/v1/mechanic`.

## 1. The feed — `GET /inbox` (`mechanicfeed`)

The mechanic twin of `lib/inbox/feed.ts`, assembled server-side because it
draws on seven sources and the wording should live beside the customer's in
`lib/inbox/`. Newest first, capped like `FEED_LIMIT`.

```jsonc
{
  "unreadCount": 3,
  "items": [{
    "id": "event:<uuid>",          // stable; the prefix names the source (below)
    "tab": "messages",             // "messages" | "alerts" | "bmt"
    "title": "Hannah Reeves",
    "detail": "Pulling into your street",
    "reference": "Job 04210 · Ford Focus",   // null when it isn't about a job
    "at": "2026-09-17T09:58:00.000Z",
    "unread": true,
    "tone": "info",                // "info" | "danger" | "success" | "warning" | "neutral" — the icon tile
    "icon": "message",             // "message" | "dispute" | "case" | "payout" | "review" | "document" | "calendar" | "quote" | "job" | "cancelled"
    "urgent": false,               // a red dot rather than a blue one
    "avatarName": "Hannah Reeves", // set for a person; the app draws initials instead of an icon
    "link": { "type": "thread", "id": "<bookingId>" }
    // link.type: "thread" | "job" (bookingId) | "dispute" (disputeId) | "case" (caseId)
    //          | "earnings" | "reviews" | "documents"   (no id)
  }]
}
```

Sources, each an allow-list in the spirit of `lib/inbox/events.ts`:

| Prefix | Tab | From | Notes |
|---|---|---|---|
| `thread:<bookingId>` | messages | `loadMechanicThreads` | one item per open thread; title the customer, detail the last message, `unread` = has unread customer messages |
| `dispute:<id>` | alerts | `disputes` on the mechanic's jobs | open ones `urgent`; title e.g. "Dispute opened by Marcus B"; detail the reason label; while `opened`/`responded`, put the escalation clock in `reference` — "Job 07312 · BMT steps in in 47h" — from `created_at`/`responded_at` + `ESCALATION_HOURS` |
| `event:<id>` | alerts | `booking_events` on assigned jobs, things the mechanic did **not** do: `reschedule_accepted`/`_declined`, `quote_approved`/`_declined`/`_expired`, `revision_approved`/`_declined`/`_expired`, `cancelled` by the customer, `mechanic_reassigned` away from them, `dispute_escalated`, `dispute_resolved`, `payment_refunded` | never `message_sent` (threads cover it), never anything the mechanic's own action wrote |
| `payout:<ledger id>` | alerts | `mechanic_ledger` `payout` and `refund_clawback` rows | "Payout sent · £268" / "£40 taken back for a dispute refund"; link `earnings` |
| `review:<id>` | alerts | `reviews` | "Priya S left a 5-star review", detail the comment; link `reviews` |
| `document:<id>` | bmt | `mechanic_documents` expiring within 30 days, or `rejected` / `expired` | `urgent` inside 14 days; link `documents` |
| `case:<id>` | bmt | `resolution_cases` | title the reason label; detail the latest admin message, else the status label; `unread` when the latest message is an admin's |

### Read state

Mirror migration 0075 for mechanics: `mechanic_inbox_reads`
(`mechanic_id pk, read_before, read_ids text[] ≤ 200, updated_at`), and the same
seven-day rule as `lib/inbox/read-state.ts`. `thread:` items ignore it — their
unread state is `messages.read_at`.

- `POST /inbox/read` — `{ "id": "event:<uuid>" }` → `{ "unreadCount": 2 }`
- `POST /inbox/read-all` → `{ "unreadCount": 0 }` (threads with unread messages still count)

Both `mechanicfeed`.

## 2. Pushes for what the feed shows

Only a customer's message pushes today; the rest reach a mechanic by email or
SMS, or not at all (a new review, a payout). Add `sendPushToMechanic` on the
`updates` channel, beside each existing email/SMS rather than instead of it:

| When | Title | `data` |
|---|---|---|
| dispute opened against them / escalated / resolved / new dispute message from the customer or BMT | as the email subject | `{ "type": "dispute", "disputeId": "…" }` |
| admin replies in, or resolves, a case | "Book My Tech replied" | `{ "type": "case", "caseId": "…" }` |
| quote, revision or reschedule answered; customer cancels | as the SMS | `{ "type": "job", "bookingId": "…" }` |
| new review | "Priya S left a 5-star review" | `{ "type": "reviews" }` |
| payout transferred | "Payout sent · £268" | `{ "type": "earnings" }` |
| a document is 30 / 14 / 1 days from expiry (the `document-expiry` cron) | as the email | `{ "type": "documents" }` |

## 3. Get help — resolution cases (`mechanic`; messages on `message`)

**Check first: the Resolution Center is not live.** The production database has
no `resolution_reasons`, `resolution_cases` or `resolution_messages` — they are
absent from `supabase gen types` (2026-09-17), so migration 0032 was never
applied, and the web "Get help" pages cannot be working. Confirm, and give Brad
the SQL to apply (0032, plus the `resolution_*` event types in the
`booking_events` CHECK if those are missing too) along with this task's own
migration.

`app/actions/resolutions.ts` is cookie-bound with no caller-parameterised core:
extract one (`openResolutionCaseFor(input, caller)` etc.) and have the server
actions call it. Note the `resolution_reasons` SELECT policy keys on
`profiles.role`, unlike every other mechanic gate — make it "has a `mechanics`
row or is admin" while you are there.

| Route | Twin of | Body | 200 |
|---|---|---|---|
| `POST /cases` | `openResolutionCase` | `{ "bookingId", "reasonId", "description", "photos"?: string[] }` | `{ "caseId": "…" }` |
| `POST /cases/[id]/messages` | `postResolutionMessage` | `{ "body": "…" }` | `{ "id": "…" }` |
| `POST /cases/[id]/close` | `updateResolutionStatus(id, "closed")` | — | `{}` |
| `POST /cases/photos` (`upload`, multipart) | new | one `file` part | `{ "url": "…" }` |

**Evidence is new.** The design has "Attach evidence" on a case and the
Resolution Center has none: add `resolution_cases.photos text[] not null default '{}'`
(cap 6, same types and 10 MB as `uploadDisputePhotoFor`, same `job-media`
bucket under `cases/<callerId>/…`), show them on the admin and mechanic web case
pages, and validate that each URL came from that upload path.

## 4. Disputes

Twins of what exists, all reusing `lib/disputes/core.ts` (already
caller-parameterised; `escalateDispute` needs extracting):

| Route | Twin of | Body | 200 |
|---|---|---|---|
| `POST /bookings/[id]/disputes` (`mechanic`) | `openDisputeFor` | `{ "reasonCategory", "description", "photos"?: string[] }` | `{ "disputeId": "…" }` |
| `POST /disputes/photos` (`upload`, multipart) | `uploadDisputePhotoFor` | one `file` part | `{ "url": "…" }` |
| `POST /disputes/[id]/messages` (`message`) | `sendDisputeMessageFor` | `{ "body": "…", "photos"?: string[] }` | `{ "id": "…" }` |
| `POST /disputes/[id]/escalate` (`mechanic`) | `escalateDispute` | — | `{}` |
| `POST /disputes/[id]/withdraw` (`mechanic`) | `withdrawDisputeFor` | — | `{}` |

Also `GET /disputes/[id]` (`mechanicfeed`) → what the screen needs and RLS alone
does not give cleanly:

```jsonc
{
  "id": "…", "bookingId": "…", "jobNumber": "07312", "service": "Full service",
  "status": "opened", "statusLabel": "Opened",
  "openedByRole": "customer", "isOpener": false,
  "customerName": "Marcus B",                 // shortPersonName
  "reasonLabel": "Workmanship", "description": "…", "photos": ["…"],
  "refundRequestedPence": 22000,
  "escalatesAt": "2026-09-19T09:44:00.000Z",  // null once escalated or closed
  "resolutionLabel": null, "resolutionNote": null, "resolutionRefundPence": null,
  "payoutLine": null,                         // the sentence the mechanic email uses, once resolved
  "can": { "reply": true, "escalate": true, "withdraw": false, "acceptRefund": true, "offerRedo": true },
  "mechanicReasons": [{ "value": "refused_signoff", "label": "Customer disputes that the work was done" }]
}
```

### New: photos in the thread ("Contest with evidence")

`dispute_messages.photos text[] not null default '{}'` (cap 6), accepted by the
messages route above and shown in all three web threads. A mechanic's first
reply to a customer's dispute already moves it to `responded`; nothing else
changes.

### New: a private BMT note

`dispute_messages.visible_to text check (visible_to in ('mechanic','customer'))`,
null = everyone. Admin-only to write, from the admin thread composer ("Only the
mechanic sees this" / "Only the customer sees this"). **The "Parties read dispute
thread" policy must hide a row from the other party** — do it in the policy, not
the UI — and the customer app's direct read must keep working unchanged.

### New: two mechanic responses — **the owner may strike this section; ask if unsure**

The design gives the mechanic three answers to a customer's dispute: contest
(above), accept the refund, or offer to come back.

- `POST /disputes/[id]/accept-refund` (`mechanic`) — only on a customer-opened
  dispute that is `opened`/`responded` and has `refund_requested_pence`. Resolves
  it through the **same code path as `resolveDispute`** — refund to the customer,
  `recordRefundClawback` against the mechanic, events, emails —
  with `resolved_by_role: 'mechanic'` (the column already allows it), resolution
  `full_refund` or `partial_refund` by amount, note "The mechanic accepted the
  refund." **No `mechanic_flags` row and no suspension count** for a refund the
  mechanic chose to give. → `{ "refundPence": 22000 }`. Make it safe against a
  double call, as `complete` and `end-on-site` are.
- `POST /disputes/[id]/offer-redo` (`mechanic`) — `{ "note"?: "…" }`. Posts a
  thread message in fixed wording ("<Name> has offered to come back and put this
  right at no extra cost. If you're happy with that, reply here to arrange a
  time — you can withdraw the dispute once it's sorted."), plus the note, and
  counts as the mechanic's response (`responded`). No new state: the customer
  accepts by arranging it in the thread and withdrawing. Once per dispute.
  → `{ "id": "…" }`.

`can.acceptRefund` / `can.offerRedo` in the GET above say whether each applies;
leave them `false` if this section is struck.

## Done when

- `GET /inbox` returns every source above for a mechanic who has one of each,
  with `unread` following the read routes; 403 for a customer.
- A mechanic's token can raise a case with a photo, reply in it and close it;
  open a dispute, reply with a photo, escalate and withdraw.
- A private note is unreadable with the other party's token **under RLS**.
- Two overlapping `accept-refund` calls refund once.
- Each push in §2 arrives once, on `updates`, with its `data`.
- The customer app and the web dispute, case and inbox pages behave as before.
