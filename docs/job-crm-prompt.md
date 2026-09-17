# Mechanic mobile API (active job) — prompt for the CRM repo

Fourth of the mechanic-app prompts. Needs Tasks 64–66 in.

> Read `/Users/bradfarrington/Downloads/bmt-mechanic-app/docs/job-crm-prompt.md`
> and do everything below the horizontal rule in it.

---

## Context

The app's job screen is the mobile twin of
`app/(mechanic)/mechanic/(shell)/jobs/[id]`. It reads what RLS allows directly
(the assigned `bookings` row, `booking_repairs`, `booking_events`,
`booking_media`, `booking_parts`, `job_quotes` + lines, `messages`,
`booking_checklist_results`) and upserts its own `mechanic_locations` row. Every
**write** on the web is a cookie-session server action, so each needs a bearer
twin.

House pattern throughout, exactly as `offers/[id]/accept/route.ts`:
`readJsonBody` first, `mobileMechanicCaller(request, family)`, `isUuid`, delegate
to **the same `lib/` core the server action uses** (extract one where the logic
still lives in the action — take `mechanicId` as a parameter), then
`refusalResponse(tag, result)` / `apiOk(...)`. Refusal sentences pass through
verbatim; the app shows them as-is. Same emails, SMS, pushes and
`booking_events` as the web. **Keep the paths, field names and shapes below, or
tell me what you changed.**

All paths are under `/api/mobile/v1/mechanic`.

## 1. `GET /bookings/[id]/job` — what the session can't assemble (`mechanicfeed`)

403/404 unless the booking is assigned to the caller.

```jsonc
{
  // Geocoded from the booking's postcode, for the en-route map and "Get
  // directions". null if it won't geocode.
  "destination": { "lat": 51.47, "lng": -0.07 },
  "distanceMiles": 1.2,                 // from the mechanic's base, as the web page
  // The same figures the web page computes, so the app never re-implements them.
  "money": {
    "customerPaysPence": 18000,         // total_pence
    "chargePence": 18000,               // max(0, total - credit - discount): what Complete captures
    "bmtPartsPence": 8100,              // Σ bmt-sourced booking_parts
    "platformFeePence": 2700,
    "commissionRate": 0.15,
    "payoutPence": 7200                 // earningsPence as job-detail shows it
  },
  // loadBookingChecklists — needs the service role (catalogue_products is
  // admin-only). Empty array when the job has none.
  "checklists": [{
    "key": "full-service", "name": "Full service", "kind": "service",   // or "inspection"
    "tier": "silver",                                                   // or null
    "answers": ["checked", "na"],       // resultsForKind(kind), in display order
    "sections": [{
      "name": "Under the bonnet",
      "items": [{ "id": "…", "label": "Engine oil level", "result": null, "comment": null }]
    }],
    "progress": { "answered": 12, "total": 56, "advisories": 0, "fails": 0 }
  }],
  // What would stop Complete right now, as the sentence completeAndCharge would
  // refuse with — null when it would go through. Lets the app explain before
  // the mechanic presses the button.
  "completeBlocker": "Enter the vehicle's mileage before completing the job.",
  "cancelReasons": ["Vehicle or parts issue", "Scheduling clash", "Unwell", "Customer unreachable", "Outside my area", "Other"]
}
```

## 2. Lifecycle (`mechanic`)

| Route | Twin of | Body | 200 |
|---|---|---|---|
| `POST /bookings/[id]/start-journey` | `startJourney` | — | `{ "status": "en_route" }` |
| `POST /bookings/[id]/begin-work` | `beginWork` | — | `{ "status": "in_progress" }` |
| `POST /bookings/[id]/mileage` | `setJobMileage` | `{ "mileage": 48210 }` | `{}` |
| `POST /bookings/[id]/complete` | `completeAndCharge` | — | `{ "status": "completed", "chargedPence": 18000, "payoutPence": 7200 }` |
| `POST /bookings/[id]/cancel` | `cancelOwnJob` | `{ "reason": "Unwell", "detail"?: "…" }` | `{}` |
| `POST /bookings/[id]/reschedule` | `proposeReschedule` | `{ "newIso": "…", "note": "…" }` | `{}` |

`complete` is the money route: a payment failure must come back as 409 with the
existing sentence (`Couldn't take payment: … The job stays open. Try again.`) and
leave the job `in_progress`. It must stay idempotent on retry, as
`captureIntent` already is. `cancel`'s "already under way" refusal currently
says "Manage it from the mobile app." — reword it for a caller who *is* the
mobile app.

`cancelOwnJob` takes one `reason` string; join `reason` and `detail` the way
`job-actions.tsx` does today.

## 3. Photos (`upload`, multipart — copy `disputes/photos/route.ts`)

- `POST /bookings/[id]/photos` — one `file` part → `{ "id": "…", "url": "…" }`.
  Twin of `uploadJobPhoto`: same types, 10 MB, same status gate.
- `POST /photos/[mediaId]/remove` → `{}`. Twin of `deleteJobPhoto`.

## 4. Checklist (`mechanic`)

`POST /bookings/[id]/checklist` — body `{ "itemId": "…", "result"?: "pass", "comment"?: "…" }`,
twin of `saveChecklistResult` (omitting a field keeps its current value).
→ `{ "progress": { "answered", "total", "advisories", "fails" }, "completeBlocker": string | null }`
for that item's checklist, so the app's counters never drift. A mechanic taps
through 50–170 of these in a row: check the `mechanic` family's 15/min burst is
not going to refuse an honest run, and give this route its own family if it is.

## 5. Messages (`message`)

- `POST /bookings/[id]/messages` — `{ "body": "…" }` → `{ "id": "…" }`. Twin of
  `sendMessageFor`; near-copy of the customer route with `mobileMechanicCaller`.
- `POST /bookings/[id]/messages/read` → `{ "cleared": 3 }`. Twin of
  `markMessagesReadFor`.
- **New:** when a *customer* sends a message, `sendPushToMechanic` on the
  `updates` channel — title `New message from <short name>`, body the first 120
  characters, `data: { "type": "message", "bookingId": "…" }`. Today a mechanic
  only hears through the unread-sweep cron.

## 6. Quotes for extra work (`mechanic`)

- `POST /bookings/[id]/quotes/preview` — `{ "lines": QuoteLineInput[] }` →
  `{ "lines": [{ "linePence": 4500 }], "totalPence": 9000, "platformFeePence": 1350, "mechanicPayoutPence": 7650, "hourlyRatePence": 4500 }`.
  `safePriceQuoteLines` with the booking's snapshotted commission; nothing is
  saved. This is how the app shows "Customer pays £90 · You earn £…" while the
  mechanic types, without owning a copy of `lib/quotes/pricing.ts`. Use
  `mechanicfeed` — it is called on every edit.
- `POST /bookings/[id]/quotes` — `CreateQuoteInput` minus `bookingId` →
  `{ "id": "…" }`. Twin of `createQuote`.
- `POST /quotes/[quoteId]/withdraw` → `{}`. Twin of `withdrawQuote`.
- `GET /bookings/[id]/repair-times?query=…` → `{ "hits": RepairTimeHit[], "truncated": boolean }`.
  Twin of `searchJobRepairTimes` (`mechanicfeed`).

## 7. Parts sourcing (`mechanic`)

`POST /booking-parts/[partId]/sourcing` — `{ "sourcing": "self" | "bmt" }` →
`{ "payoutPence": 7200 }`. Twin of `setPartSourcing`.

## Not in this prompt

Faults, job revisions, end-on-site, part status (`markPartStatus`) and bulk
reschedule have no screen in the app's design yet. Leave them web-only.

**A customer signature is deliberately not requested.** The app's design shows
one, but `job-media.ts` records that it was removed on the owner's instruction
(2026-09-08). Completion in the app is the same two-step "Confirm & charge" as
the web until that decision is revisited — do not add signature capture.

## Done when

- A mechanic's token can take a test job confirmed → en route → in progress →
  completed through these routes alone, with the same customer emails/SMS/push
  and `booking_events` as the web, and the payout transfer recorded.
- A customer's token gets 403 everywhere; another mechanic's gets 403/404.
- A failed capture leaves the job `in_progress` and a retry succeeds.
- The web job page behaves exactly as before.
