# Mechanic mobile API (the Account tail) — prompt for the CRM repo

Seventh and last of the mechanic-app prompts. Needs Tasks 64–69 in. It covers
the Account tab: earnings and payouts, documents, profile and avatar, reviews,
and the account-level things the customer app already has — changing the
sign-in email and deleting the account. The owner needs all of them in the app.

Not in scope: the Pro tier. `mechanics.is_pro` is an admin-set flag with no
criteria, no path to it and a `take_rate_pro` that is never applied (Task 11
Stage 2 was deferred), so the app shows nothing for it. If it is ever built,
it gets its own prompt.

> Read `/Users/bradfarrington/Downloads/bmt-mechanic-app/docs/account-crm-prompt.md`
> and do everything below the horizontal rule in it.

---

## Context

Same house pattern as Tasks 67–69: `readJsonBody` first,
`mobileMechanicCaller(request, family)`, `isUuid`, delegate to a shared `lib/`
core with the mechanic id passed in, `refusalResponse` / `apiOk`. Refusal
sentences pass through verbatim. **Keep the paths, field names and shapes
below, or tell me what you changed.** All paths are under
`/api/mobile/v1/mechanic`.

The app already does what RLS allows directly, exactly as the web pages do:
it reads `mechanic_ledger`, its completed `bookings`, `mechanic_documents`,
`reviews` (with the `bookings(customer_name)` join), `profiles` and
`mechanics`; it writes `full_name`, `phone`, `bio`, `service_radius_miles`,
`specialisms` and `mechanic_availability`. Nothing below duplicates those. What
is left is what the web does with the secret key or the service role.

## 1. Earnings — `GET /earnings` (`mechanicfeed`)

The web earnings page reads the ledger and the bookings itself and does the
month-to-date, average and projection sums client-side; the app does the same.
What it cannot do is see Stripe. Answer with:

```jsonc
{
  // mechanicBalanceSummary — what BMT owes them right now; negative while a
  // fronted refund is being recovered.
  "balance": { "totalEarnedPence": 0, "totalPaidOutPence": 0, "totalClawedBackPence": 0, "balancePence": 0 },
  // The rate that will be applied to their next job, as a fraction — today
  // `take_rate_base`.
  "commissionRate": 0.15,
  // null until Connect is set up. Stripe's external account on the Express
  // account: bank name and last four, nothing else.
  "account": { "bankName": "Barclays", "last4": "4831" } | null,
  // stripe.transfers.list({ destination, limit: 12 }), newest first — the real
  // thing, not the web page's weekly preview. `bookingId` when the transfer's
  // metadata or the matching `payout` ledger row names one.
  "payouts": [{ "id": "tr_…", "at": "2026-09-16T10:12:00Z", "amountPence": 26800, "status": "paid", "bookingId": "…" | null, "description": "Front brake pads & discs · BMT-A1B2" | null }],
  // false when Connect is not set up or Stripe is unconfigured, so the app can
  // say "Payouts start once you're set up" rather than "No payouts yet".
  "payoutsLive": true
}
```

Mechanics are paid per job on completion (owner decision 2026-07-01), so
there is no "next payout" — the app does not draw one. Do not port
`buildPayoutRows`' weekly preview or its `•••• 4242`.

### `POST /stripe/dashboard` (`mechanic`) → `{ "url": "…" }`

`stripe.accounts.createLoginLink(accountId)` — the Express dashboard, where
the bank account is changed and each transfer is itemised. Nothing in the
repo makes one yet; the app opens it in the in-app browser, the same as
onboarding. 409 with a sentence when Connect is not set up.

## 2. Documents

The list is a direct read. The bucket is private and both the write and the
signed read are service-role, so:

- `POST /documents` (`mechanicupload`, multipart) — fields `doc_type`, `file`,
  `expires_at` (optional, `YYYY-MM-DD`, empty = none) → `{ "id": "…" }`. Twin
  of `uploadMechanicDocument`: same types, 10 MB, pdf/jpeg/png/webp, same
  path, `pending_review`. Return the new row's id so the app can show it
  straight away.
- `GET /documents/[id]/url` (`mechanicfeed`) → `{ "url": "…", "expiresIn": 3600 }`.
  Twin of `getMechanicDocumentUrl`; the app opens it in the in-app browser.

## 3. Profile — `POST /avatar` (`mechanicupload`, multipart)

Field `avatar` → `{ "url": "…" }`. Twin of `uploadAvatar`: 5 MB, jpeg/png/webp,
public `avatars` bucket, `profiles.avatar_url` written with the cache-buster.

## 4. Reviews — `POST /reviews/[id]/response` (`mechanic`)

`{ "response": "…" }` → `{}`. Twin of `respondToReview`: 1–1000 characters,
"This isn't your review." as 403. Editing an existing reply is the same call.

## 5. Account — email change and deletion

Both exist for customers (`/account/email`, `/account/delete`) and both
refuse a staff token. Mechanics need the same two, under
`requireMobileMechanic`:

- `POST /account/email` (`action`) — `{ "new_email", "current_password" }` →
  200 `{ "ok": true, "sentTo" }` or `{ "ok": false, "error", "field"? }`, the
  customer route's shape exactly. `pending_email_changes.customer_id` is a
  `profiles` FK, so the core works as-is; the confirmation page is the same
  web page.
- `POST /account/delete` (`action`) — `{ "confirm": true }` → `{ "ok": true }`
  or `{ "ok": false, "code", "error" }`. Apple requires in-app deletion, and a
  mechanic can sign up in the app. `delete_customer_account()` is not enough
  here: a mechanic has a ledger, live jobs, offers, documents in a private
  bucket and push tokens. Write the mechanic core and its blockers — at least a
  job that is `confirmed`, `en_route` or `in_progress` (`live_booking`), an
  open dispute (`open_dispute`), an open case (`open_case`) and a non-zero
  ledger balance (`balance_owed`, BMT's money or theirs) — and anonymise the
  way 0065 does: the auth user goes, the `profiles` row is scrubbed, the
  `mechanics` row goes offline and stops receiving offers, documents are
  deleted from the bucket, push tokens revoked, and completed bookings, the
  ledger and reviews stay as records. Say what SQL you need.

## Also tell me

- Whether `reviews` has any per-mechanic "replied" count the app should use
  rather than counting rows itself.
- Whether an expired or rejected document can be replaced by a new upload of
  the same `doc_type` (the app assumes yes: the newest row per type is the
  current one, older rows are history).

## Done when

- A mechanic's token gets its balance, bank name and real transfers from
  `/earnings`, and a dashboard link from `/stripe/dashboard`.
- It can upload a document and open it; upload an avatar; reply to a review
  and edit that reply.
- It can start an email change and delete its account, and each blocker
  refuses with its code.
- A customer's token gets 403 everywhere; another mechanic's gets 403/404.
- The web earnings, documents, profile and reviews pages behave exactly as
  before.
