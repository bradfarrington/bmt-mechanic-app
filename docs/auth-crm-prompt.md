# Mechanic mobile API (auth & onboarding) — prompt for the CRM repo

The mechanic app's auth stack is built and calls three endpoints that do not
exist yet. Until they do, sign-in, password reset and the setup wizard work,
but **Continue with Stripe** and the **Online/Offline button** answer with an
error.

> Read `/Users/bradfarrington/Downloads/bmt-mechanic-app/docs/auth-crm-prompt.md`
> and do everything below the horizontal rule in it.

---

## Context

`app/api/mobile/v1/*` is customer-only today, and `staffRefusal` actively 403s
a mechanic's token. The mechanic web surface does its privileged work in
cookie-session server actions (`app/actions/stripe-connect.ts`,
`app/actions/mechanic-status.ts`), which a native app cannot call.

The app already does everything RLS allows directly with supabase-js — service
radius, specialisms, working hours — mirroring `app/actions/mechanic-profile.ts`.
What is left needs a server: Stripe's secret key, and the dispatcher.

Follow the existing mobile conventions throughout: `apiOk` / `apiError` /
`readJsonBody` from `lib/mobile/respond.ts` (JSON content type required, no
CORS), bearer auth via `lib/supabase/mobile.ts`, rate limiting via
`enforceBookingLimits` with a new bucket family seeded by migration.

## 1. `requireMobileMechanic`

Beside `requireMobileCustomer` in `lib/mobile/booking-guards.ts` (or a new
`lib/mobile/mechanic-guards.ts`). Wraps `requireMobileUser`, then checks for a
`mechanics` row with the caller's own client:

```ts
caller.supabase.from("mechanics").select("*").eq("id", caller.userId).maybeSingle()
```

**Not** `role === 'mechanic'` — an admin who also works jobs keeps
`role = 'admin'`; the row is what grants access. Same rule as
`lib/mechanics/require-mechanic.ts` and `proxy.ts`. 403 with
`"This account isn't set up as a mechanic."` when there is no row. Return the
row alongside the caller.

## 2. `POST /api/mobile/v1/mechanic/stripe/onboarding`

Body: `{ "returnUrl": string }`. Response: `{ "url": string }`.

The mobile twin of `startStripeOnboarding()`: create the Express account on
first call (`createConnectedAccount`, store `stripe_account_id`), then an
account link.

Stripe only accepts **https** `return_url` / `refresh_url`, and the app needs to
land back on its own scheme. So:

- Validate `returnUrl` against an allow-list of schemes — `bmtmechanic://` and,
  for Expo dev builds, `exp+bmt-mechanic-app://`. Reject anything else with 400;
  this must not become an open redirect.
- Add a tiny page, e.g. `app/mechanic/onboarding/stripe/mobile-return/route.ts`,
  that 302s to the validated app URL. Pass the target through as a query param
  (re-validated on the way out), or sign it.
- Parameterise `createOnboardingLink(accountId, { returnUrl, refreshUrl })` so
  the mobile route hands Stripe that page for **both** URLs — on `refresh` the
  app simply asks for a new link. The web flow keeps its current URLs.

The app opens `url` with `WebBrowser.openAuthSessionAsync(url, returnUrl)`,
which closes itself when it sees the redirect to `returnUrl`.

## 3. `POST /api/mobile/v1/mechanic/stripe/refresh`

No body. Response: `{ "payoutsEnabled": boolean }`.

The mobile twin of `refreshStripeStatus()` — retrieve the account, write the
three flags via `accountFlags`, and keep the existing behaviour on the
disabled→enabled transition (go online, `redispatchPending()`). Share the
implementation with the server action rather than copying it. A mechanic with
no `stripe_account_id` yet gets `{ payoutsEnabled: false }`, not an error.

## 4. `POST /api/mobile/v1/mechanic/status`

Body: `{ "status": "online" | "offline" }`. Response: `{ "status": … }`.

The mobile twin of `setOwnAvailability()`. Refused actions should follow the
customer-action convention if that is simpler to share code, but the app reads
a non-2xx `{ error }` — so answer a refusal with 409 and the message:

- no payouts → `"Connect your bank account before going online."`
- `status = 'on_job'` or `is_suspended` → refuse, say why.

On going online: stamp `online_at` on the offline→online transition,
`last_seen_at` always, then `redispatchPending()`. Extract the body of the
server action into a shared function both callers use.

**Worth doing at the same time:** RLS lets a mechanic write `status = 'online'`
straight to their row, skipping the payouts gate. A `BEFORE UPDATE` trigger on
`mechanics` refusing `online` while `stripe_payouts_enabled` is false would
close that for every client, not just this one. The self-update policy is also
not column-restricted — `rating`, `job_count`, `is_pro`, `is_suspended` and the
`stripe_*` flags are writable by the mechanic. Column grants like migration
0079 did for `profiles` would fix it; the app only ever writes
`service_radius_miles`, `specialisms`, `base_postcode` (when empty) and `bio`.

## 5. First password from the approval email (optional, can follow later)

`approveApplication` / `createMechanicAction` email a recovery link to
`/auth/callback?token_hash=…&type=recovery&next=/mechanic/set-password` — the
web page. The app has the same screen at `bmtmechanic://set-password`, and it
accepts `?token_hash=…&type=recovery` directly (it calls `verifyOtp` itself).

A recovery token is single-use, so the email cannot offer both. Options: keep
the web link as is (the mechanic sets a password on the web, then signs in on
the app — works today, nothing to do), or add a second "Open in the app" button
built from the same `hashed_token`, and accept that whichever is tapped first
wins. Leave as is unless asked.

## Supabase dashboard

Authentication → URL Configuration → Redirect URLs needs
`bmtmechanic://reset-password` (and `exp+bmt-mechanic-app://reset-password` for
dev builds), or the "Forgot password?" email lands on the site URL instead of
the app.

## Done when

- A mechanic's bearer token gets 200 from all three routes; a customer's gets 403.
- `returnUrl: "https://evil.example"` gets 400.
- Going online without payouts gets 409 with the message above.
- Web onboarding and the web online toggle behave exactly as before.
