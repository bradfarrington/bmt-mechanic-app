# BMT Mechanic App

Expo (React Native) mobile app — the **mechanic-facing** app for BMT. The
customer app is its sibling repo, `bmt-customer-app`; this one is built on the
same scaffold and the same design tokens, and shares its Supabase backend with
the CRM (`bookmytech`). Keep this codebase mechanic-only.

When something here has an equivalent in the customer app — a primitive, a
lib helper, a config choice — copy that rather than inventing a second way.

## Stack

- **Expo SDK 57**, React Native 0.86, React 19.2 — New Architecture enabled.
- **Expo Router** (file-based routing) under `src/app/`, typed routes on.
- **React Compiler** enabled (`experiments.reactCompiler`).
- TypeScript strict. Path alias `@/*` → `src/*`, `@/assets/*` → `assets/*`.
- Native iOS/Android folders are **not committed** — generated on demand via
  Continuous Native Generation (`npx expo prebuild`) / EAS Build. `.gitignore`
  excludes `/ios` and `/android`.

> Expo changes fast. Check the versioned docs at
> https://docs.expo.dev/versions/v57.0.0/ before writing native/config code.

## Layout

- `src/app/` — routes (screens). `_layout.tsx` is the root layout.
  - `(app)/(tabs)/` — the four hubs: Today · Jobs · Inbox · Account.
  - Everything pushed from a hub lives beside `(tabs)` in `(app)`, so it covers
    the tab bar.
- `src/components/` — shared components (`ui/` for primitives, copied from the
  customer app). `tab-bar.tsx` is the tab bar and its centre status button.
- `src/constants/theme.ts` — theme tokens: the customer app's file plus the
  mechanic additions from `design/TOKENS.md`, each marked "Mechanic app".
- `src/lib/auth.tsx` — session, `profiles` row and `mechanics` row. "Is a
  mechanic" means **has a `mechanics` row**, not `role === 'mechanic'`.
- `src/lib/mechanic.ts` — the mechanic's own settings. Anything RLS allows
  (radius, specialisms, hours) is written direct with supabase-js, mirroring the
  CRM's web actions; anything needing Stripe or the dispatcher goes through
  `src/lib/api.ts` to the CRM's `/api/mobile/v1/mechanic/*`.
- `src/lib/status.tsx` — Online / Offline / On a job / Locked, derived from the
  `mechanics` row. Going online goes through the CRM, never a direct write.
- `src/lib/offers.ts` + `src/hooks/use-offers.ts` — live offers, **polled** from
  the CRM every 10s while Today is focused (the CRM does not use Supabase
  Realtime). Never read an offered booking from `bookings`: before acceptance
  the customer's name, phone and address are not the mechanic's to see.
- `src/lib/summary.ts` — the CRM's half of a day (`GET /mechanic/summary`):
  distances, leave-by, accept rate and totals. The app never geocodes.
- `src/lib/jobs.ts` — the mechanic's own bookings, read direct under RLS.
- `src/lib/job.ts` — one job: reads direct under RLS, every write through the
  CRM (`/mechanic/bookings/:id/*`). The money, the checklists and the map
  coordinates come from `GET …/job`; the app never prices or geocodes.
- Revisions (`jobs/[id]/revise`) edit a list of repair ids and parts and ask the
  CRM for a preview; the app never builds a snapshot or prices one.
- `src/lib/location.ts` + `src/hooks/use-journey-sharing.ts` — the mechanic's
  position, upserted to `mechanic_locations` only while a job is `en_route`
  and its screen is open, and deleted when that ends.
- `src/lib/inbox.ts` + `src/lib/inbox-state.tsx` — the unified feed, built by
  the CRM (`GET /mechanic/inbox`) and shared by the Inbox tab and the tab bar's
  unread dot. `src/lib/links.ts` turns an inbox row or a push into a route.
- `src/lib/disputes.ts` / `src/lib/cases.ts` — a dispute has the customer in
  it and can move money; a Get-help case is between the mechanic and BMT only.
  Both read direct under RLS; every write goes through the CRM.
- `src/lib/messages.ts` — the booking thread; polled, like the CRM's own.
- `src/lib/push.ts` — Expo push via `/mechanic/devices`, Android channel
  `offers`; a tapped offer push opens `/offer/[id]`.
- The Account tail (`(tabs)/account.tsx` and the screens it pushes):
  `src/lib/earnings.ts` sums the mechanic's own completed bookings (month to
  date, projection, daily series) and asks the CRM only for Stripe's side
  (`GET /mechanic/earnings`, `POST /mechanic/stripe/dashboard`); there is no
  "next payout" — mechanics are paid per job. `src/lib/documents.ts` lists
  direct, uploads and views through the CRM (the bucket is private).
  `src/lib/profile.ts` writes name, phone and bio direct; the avatar goes
  through the CRM. `src/lib/reviews.ts` reads direct; a reply goes through the
  CRM. `src/lib/account.ts` is the email change and deletion, under
  `/mechanic/account/*`. Availability reuses `src/lib/mechanic.ts`. There is
  no Pro screen: `is_pro` is an admin-set flag with nothing behind it yet.
- `src/app/index.tsx` — entry router: sign-in, first-run setup (`(onboarding)`)
  or Today. Saved working hours are the "has onboarded" signal.
- `docs/*-crm-prompt.md` — work the CRM repo needs for this app, written as
  prompts to run there.
- `design/` — the target mockups, the screen → route map and the token additions.

## Building screens

Read `design/README.md` first for the per-screen file map (mockup frame ↔
`src/app/*.tsx`) and the build order, and `design/TOKENS.md` for the tokens.
Any colour, radius, spacing or type value should resolve to `Palette.*`,
`Spacing.*`, `Radius.*` or `Typography.*` in `src/constants/theme.ts` — never a
raw hex or pixel; add the token first if it doesn't exist. Reg plates, job IDs
and account numbers use the `mono` text variant (JetBrains Mono). British
English throughout; no emoji in app copy.

Don't touch backend logic: all data comes from the existing Supabase schema. If
a screen needs a field that doesn't exist, the migration goes in the CRM repo.

## Commands

```bash
npm run ios        # build the native app and launch it on the iOS simulator
npm run android    # same for Android
npm run start      # Metro only, against an already-installed dev build
npm run web        # web target
npm run lint       # expo lint
npx tsc --noEmit   # typecheck (keep clean)
npm run db:types   # regenerate src/types/database.ts after a CRM migration
npx expo export --platform ios   # verify the iOS bundle builds
```

Needs a `.env` — copy `.env.example`; the values are the customer app's. The
web target only exists for quick layout checks: a static web export fails on
`window` inside supabase-js, so export with `web.output` temporarily set to
`"single"` and do not commit that change.

Re-run `npx expo prebuild --platform ios` after touching `app.json` plugins or
adding a native dependency. It regenerates `ios/` from scratch, so never hand-
edit anything in there — the folder is git-ignored and disposable.

`patches/expo-modules-jsi+57.1.0.patch` (applied by `postinstall` through
patch-package, as in the customer app) makes the package build under Xcode
26.3 / Swift 6.2.4: it removes `SWIFT_RETURNS_RETAINED` from the two
`RuntimeScheduler` constructors, which that compiler rejects, and boxes the
raw pointers in `JavaScriptRuntime.swift` in an `@unchecked Sendable` struct,
because the compiler no longer accepts a `nonisolated(unsafe) let` shadow
being sent into `JavaScriptActor.assumeIsolated`. Swift 5 language mode is
not an alternative: the package's bare regex literals and actor-isolated
initialisers need Swift 6 mode. The customer app's own patch (an `abs`
ambiguity in 57.0.4) is not needed at 57.1.0. Drop this one when a newer
`expo-modules-jsi` builds clean.
