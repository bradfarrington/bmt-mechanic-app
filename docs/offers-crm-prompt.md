# Mechanic mobile API (offers) — prompt for the CRM repo

Second of the mechanic-app prompts. Run **after** `auth-crm-prompt.md`, which
adds `requireMobileMechanic` — everything here is gated by it.

> Read `/Users/bradfarrington/Downloads/bmt-mechanic-app/docs/offers-crm-prompt.md`
> and do everything below the horizontal rule in it.

---

## Context

The mechanic app's Today screen lists live offers and lets the mechanic accept
or decline — first to accept wins. It **reads** offers itself: `job_offers` has
a SELECT policy for the owning mechanic and is already in the
`supabase_realtime` publication (0008). It cannot **respond**: there is no
write policy, and rightly — `acceptOffer` assigns the booking and supersedes
every sibling offer atomically with the service role, then emails, texts and
pushes the customer.

So the app needs mobile twins of three server actions, and a way to hear about
an offer while it is closed. Same conventions as the existing mobile routes:
`apiOk` / `apiError` / `readJsonBody`, bearer auth, a rate-limit family seeded
by migration. **Extract each action's body into a shared function** that takes
the mechanic id, and call it from both the server action and the route — do not
copy the logic. A refused action answers non-2xx `{ error }` (409 for "someone
else got it" / "already responded", 403 for "not yours", 404 for "no longer
exists") — the app tells "taken" apart from other failures by the 409.

## 1. `POST /api/mobile/v1/mechanic/offers/[id]/accept`

Twin of `acceptOffer(offerId)` in `app/actions/job-offers.ts`. Response:
`{ "bookingId": string, "needsArrivalWindow": boolean }`. Every side effect the
web accept has — claim, supersede siblings, customer email/SMS/push, events —
must happen here too.

## 2. `POST /api/mobile/v1/mechanic/offers/[id]/decline`

Twin of `declineOffer(offerId)`. Response: `{}`.

## 3. `POST /api/mobile/v1/mechanic/bookings/[id]/arrival-window`

Twin of `setArrivalWindow(bookingId, window, dayKey?)` in
`app/actions/mechanic-jobs.ts`. Body: `{ "window": string, "dayKey"?: string }`.
Needed straight after accepting an all-day or flexible booking. Also expose
what the app needs to draw the picker — the allowed two-hour windows
(`twoHourSlotByWindow`'s source list) — either in the accept response or as
`GET /api/mobile/v1/mechanic/arrival-windows`, so the list is not duplicated in
the app.

## 4. Push to mechanics

Today only customers get push (`sendPushToCustomer`, tokens in
`customer_push_tokens`). Offers are time-critical, so:

- Store mechanic device tokens. Either a `mechanic_push_tokens` table mirroring
  migration 0050, or generalise the existing one — whichever keeps
  `sendPushToCustomer` untouched. Own-row RLS is not needed if writes stay
  behind the route.
- `POST /api/mobile/v1/mechanic/devices` and `/devices/remove`, mirroring the
  customer pair, gated by `requireMobileMechanic`. Keep them separate from the
  customer routes so one phone with both apps installed cannot cross the
  streams.
- `sendPushToMechanic(mechanicId, notification)` beside `sendPushToCustomer`,
  sharing `buildPushMessage` / `triageTickets` / receipt collection.
- Call it from `lib/dispatch/dispatch.ts` wherever a `job_offers` row is
  created, with `data: { type: "offer", offerId }` so the app can deep-link to
  `bmtmechanic://offer/<offerId>`. Use a separate Android channel (`offers`,
  max importance) from the customers' `bookings` one.

## Check while you are there

- What the app can read under RLS as a mechanic: its own `job_offers` rows, and
  the `bookings` row an offer points at **before** it is accepted (vehicle,
  repair, rough location, payout). If the pre-accept booking is not readable,
  either add a narrow policy (booking readable to a mechanic holding a pending
  offer for it) or return an offer summary from a
  `GET /api/mobile/v1/mechanic/offers` route — and say which you chose. The
  customer's full address and phone should stay hidden until accepted.
- Whether offers carry an expiry (`expires_at` or similar) the app can count
  down against.

## Done when

- Two mechanics' tokens race `accept` on the same booking: one 200, one 409.
- A customer's token gets 403 on every route.
- Creating an offer sends a push to a registered mechanic device.
- The web offer page behaves exactly as before.
