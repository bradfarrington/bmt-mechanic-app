# Design — BMT Mechanic App

High-fidelity mockups for the **mechanic-facing** native mobile app. The
customer app design lives in the sibling repo `bmt-customer-app` under
`design/`; the mockups here are the tradesperson-side twin.

The Expo project isn't scaffolded yet — these mockups are the target.
Scaffold with `npx create-expo-app` at the root of this repo, mirror the
customer app's stack (SDK 57, Expo Router, TypeScript strict, React
Compiler, path alias `@/*` → `src/*`), then follow the customer-app
playbook — tokens first, then the tab shell, then each journey in order.

## Product summary

A BMT mechanic is a self-employed, vetted mobile technician. Their day is a
chain of **accept-the-job → drive → diagnose → fix → sign-off → get-paid**,
with a 15% (or 12% for Pro-tier) commission coming out of each customer
payment. This mobile app is the field tool that sits on their phone while
the van is on the move — it exists to (a) surface live job offers within
seconds so first-to-accept wins, (b) walk them through the lawful five-step
job lifecycle and capture the pre-authorised Stripe charge on signature,
(c) let them message the customer, snap photos, and quote for extra work,
and (d) show them what they've earned and when it lands.

## What's in this folder

- **`mockups/`** — five standalone HTML canvases, one per user journey.
  Each is a set of 390×844 iPhone frames laid out side by side. Open in a
  browser — no build step, Google Fonts + Lucide come from CDN.
- **`TOKENS.md`** — new tokens beyond the shared BMT design system that
  the mechanic app needs (online-status FAB, urgency halos, gold Pro
  gradient, JetBrains Mono for reg plates and job IDs).

Interactive versions in Claude Design:
<https://claude.ai/design/p/acc69a34-0b90-4a09-913e-fc3db01c6718>.

## The one-line architecture

- **New repo**: `bmt-mechanic-app` (Expo SDK 57, React Native, Expo Router,
  TypeScript strict — mirror the customer app's stack).
- **Shared design tokens**: pull `src/constants/theme.ts` verbatim from the
  customer app (or extract to a shared package `@bmt/design-tokens` when it
  starts hurting). Add the mechanic-specific tokens from `TOKENS.md` here.
- **Shared Supabase backend**: same project as the customer app + CRM. RLS
  scopes each mechanic to their own rows. No new tables required for MVP —
  everything the current `bookmytech/app/(mechanic)/` web surface writes
  is already there.
- **Two extra native modules** the customer app doesn't need:
  - `expo-location` (foreground service) — live GPS updates while
    `status = en_route`.
  - `expo-camera` — photo capture on the inspection runner and job detail.
  - `expo-image-picker` — pick-from-library fallback for document uploads.
  - `@stripe/stripe-react-native` — Stripe Connect Express onboarding via
    in-app browser (`WebBrowser.openBrowserAsync`) is the recommended path.

## Screen map

Every mockup frame → a target screen path in the new repo. Paths follow
Expo Router conventions.

### 01 — Auth & Onboarding (`mockups/01-auth-onboarding.html`)

| # | Frame | Target path |
|---|-------|-------------|
| 1 | Splash | `src/app/index.tsx` (redirect shim, native splash config in `app.json`) |
| 2 | Sign in | `src/app/(auth)/login.tsx` |
| 3 | Set password (first login) | `src/app/(auth)/set-password.tsx` |
| 4 | Connect Stripe · payouts gate | `src/app/(onboarding)/payouts.tsx` |
| 5 | Set up · service area | `src/app/(onboarding)/service-area.tsx` |
| 6 | Set up · working hours | `src/app/(onboarding)/hours.tsx` |
| 7 | Set up · specialisms | `src/app/(onboarding)/specialisms.tsx` |
| 8 | Ready · you're online | `src/app/(onboarding)/ready.tsx` |

### 02 — Today & Live offers (`mockups/02-today-offers.html`)

| # | Frame | Target path |
|---|-------|-------------|
| 1 | Today · online | `src/app/(app)/(tabs)/index.tsx` — Home tab |
| 2 | Live offers | `src/app/(app)/(tabs)/index.tsx` (offers section) or `offers.tsx` |
| 3 | Offer detail · accept/decline | `src/app/(app)/offer/[id].tsx` — modal presentation |
| 4 | Offer · already taken | Same route, "gone" state |
| 5 | Today · offline | Same as #1, different online-state |
| 6 | Today · payouts not set up | Same as #1, gated state — persistent yellow banner |
| 7 | Tomorrow at a glance | `src/app/(app)/tomorrow.tsx` — modal from a nightly push |
| 8 | End of day recap | `src/app/(app)/recap.tsx` — modal from last-job completion |

### 03 — Active job (`mockups/03-active-job.html`)

| # | Frame | Target path |
|---|-------|-------------|
| 1 | Jobs · schedule | `src/app/(app)/(tabs)/jobs.tsx` — Jobs tab |
| 2 | Job · confirmed | `src/app/(app)/jobs/[id]/index.tsx`, status = confirmed |
| 3 | Job · en route | Same file, status = en_route |
| 4 | Job · in progress | Same file, status = in_progress |
| 5 | Signature · full-screen | `src/app/(app)/jobs/[id]/signature.tsx` — modal |
| 6 | Inspection runner | `src/app/(app)/jobs/[id]/inspect.tsx` — modal |
| 7 | Quick-quote sheet | `src/app/(app)/jobs/[id]/quote.tsx` — bottom sheet |
| 8 | Job · completed | Same as #2, status = completed |

### 04 — Inbox & Messages (`mockups/04-inbox-messages.html`)

| # | Frame | Target path |
|---|-------|-------------|
| 1 | Inbox · unified feed | `src/app/(app)/(tabs)/inbox.tsx` — Inbox tab |
| 2 | Messages · canned replies | `src/app/(app)/jobs/[id]/messages.tsx` |
| 3 | Raise a case | `src/app/(app)/cases/new.tsx` |
| 4 | Dispute · three-way | `src/app/(app)/disputes/[id].tsx` |

### 05 — Account & Earnings (`mockups/05-account-earnings.html`)

| # | Frame | Target path |
|---|-------|-------------|
| 1 | Account | `src/app/(app)/(tabs)/account.tsx` — Account tab |
| 2 | Earnings & payouts | `src/app/(app)/earnings.tsx` |
| 3 | Availability | `src/app/(app)/availability.tsx` |
| 4 | Documents | `src/app/(app)/documents.tsx` |
| 5 | Profile | `src/app/(app)/profile.tsx` |
| 6 | Reviews | `src/app/(app)/reviews.tsx` |
| 7 | Go Pro | `src/app/(app)/pro.tsx` |
| 8 | Help centre | `src/app/(app)/help.tsx` |

## Navigation

Bottom tab bar with a raised centre **status FAB** (not a plus button — a
stateful pill showing Online / Offline / On a job). Same shell as the
customer app for muscle memory, different centre control.

```
(app)/
  (tabs)/
    _layout.tsx       — tab bar (Today · Jobs · Status FAB · Inbox · Account)
    index.tsx         — Today tab (default landing)
    jobs.tsx          — Jobs tab
    inbox.tsx         — Inbox tab
    account.tsx       — Account tab
  jobs/[id]/…         — pushed job detail stack, hides tab bar
  offer/[id].tsx      — modal offer surface, hides tab bar
  disputes/[id].tsx   — pushed dispute thread
  cases/…             — pushed resolution cases
  earnings.tsx        — pushed earnings dashboard
  availability.tsx    — pushed availability editor
  documents.tsx       — pushed documents
  profile.tsx         — pushed profile
  reviews.tsx         — pushed reviews
  pro.tsx             — pushed Pro-tier info
  help.tsx            — pushed help centre
  tomorrow.tsx        — modal end-of-day teaser (from a push)
  recap.tsx           — modal end-of-day recap
```

**The centre status FAB** has three states, all visible on the tab bar:

| State | Fill | Icon | Label | Tap |
|---|---|---|---|---|
| Online | Green gradient with pulsing halo | Power | Online (green) | Toggle to Offline |
| Offline | White with grey ring | Power | Offline (grey) | Toggle to Online |
| On a job | Blue gradient | Wrench | On a job (blue) | No-op — locked until job ends |

Long-press when Online → "Go offline for 30 min / 1 hour / until tomorrow"
sheet. Long-press when Offline → "Go online now / at your next shift"
sheet.

## Order to do the redesign in

1. **Scaffold the repo.** `npx create-expo-app bmt-mechanic-app --template
   tabs`, then rip out the template screens. Keep TypeScript strict, React
   Compiler on, path alias `@/*` → `src/*`. Copy the customer app's
   `CLAUDE.md`, `app.json` (with the tech-app bundle ID), `patches/`, and
   `eslint.config.js`.
2. **Land the tokens.** Copy `src/constants/theme.ts` from the customer app
   verbatim, then add the mechanic-specific values from `TOKENS.md`.
3. **Auth stack.** Sign in + set password + Stripe Connect (in-app browser)
   + first-run availability wizard. Ships as its own PR so onboarding works
   before anything else does.
4. **Tab shell + status FAB.** Four tabs + the raised online-status pill.
   Placeholder tab screens (empty cards) — no data yet.
5. **Today & offers.** Real Supabase queries (`bookings` filtered by
   `mechanic_id + today`, `job_offers` realtime channel). Live offer detail
   with the accept/decline hero. This is the app.
6. **Active job.** State-machine driven job detail + signature pad +
   photos. Foreground `expo-location` starts when Start Journey is tapped
   and stops when the job completes.
7. **Inbox + messages.** Combined thread/notification feed, canned replies,
   3-way dispute view.
8. **Account tail.** Earnings, availability, documents, profile, reviews,
   Pro-tier, help centre.

## Rules of the road

- **Match the customer app's design language.** Same Inter Tight display
  face, same BMT blues, same spacing scale, same card treatments. The
  differences are in `TOKENS.md`.
- **Don't touch backend logic.** All data comes from the existing Supabase
  schema — same tables the CRM at `bookmytech/` writes to. If a screen
  needs a field that doesn't exist, add a migration in the CRM repo first.
- **British English throughout.** Match BMT's plain-spoken voice: "You're
  on the way", "Complete job &amp; charge customer", "First to accept wins",
  "You earn £X". Never salesy. Never emoji (the exception is the "👍" chat
  bubble which is a customer-authored message, not app copy).
- **Reg plates, job IDs, and account numbers use JetBrains Mono.** All
  other numbers use Inter Tight (headings) or Inter (body).
- **The Status FAB is the north star.** It's always visible on the four
  tab hubs, and it locks to "On a job" while a booking is active. The user
  should never wonder what mode they're in.
