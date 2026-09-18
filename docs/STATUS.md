# Where we are — BMT mechanic app

Last updated **2026-09-18**. Read this first when picking the work
up, on this machine or a new one. `CLAUDE.md` explains how the code is laid
out; `design/README.md` has the mockup → screen map and the build order.

## Start here next session

In this order. Tick them off and update this file as you go.

1. ~~Get the rest of the CRM's reply to the inbox prompt~~ — **done
   2026-09-18.** The full reply is the CRM's own task note,
   `bookmytech/docs/tasks/69-mechanic-inbox-cases-disputes.md`; what it says
   is summarised below. The contract was kept: no path or field changed.
2. ~~Apply the SQL~~ — **done.** Brad applied 0085 on 2026-09-17. It creates the
   `resolution_*` tables itself; **never run CRM migration 0032** (its
   `booking_events` CHECK is out of date and fails against today's rows).
3. ~~`npm run db:types` and remove the stand-ins~~ — **done 2026-09-18.**
   `src/lib/cases.ts` uses the generated types; `src/lib/disputes.ts` reads
   `photos` / `visible_to` straight off the row.
4. ~~Check CRM Task 68 is live~~ — **pushed.** `38f67bd` is on the CRM's
   `origin/main` (HEAD `d025f29`). Whether Vercel has deployed it has not been
   checked from here; the CRM auto-deploys `main`.
5. ~~Start step 8, the Account tail~~ — **built 2026-09-18** on branch
   `account` (off `inbox`). Ten screens, five lib files, three components;
   `docs/account-crm-prompt.md` is the CRM's side. **Brad runs it in the CRM
   repo** (the one-liner is the quote at the top of that file), then pastes
   the reply here — the CRM keeps its reply in
   `bookmytech/docs/tasks/70-*.md`, so it can be read from there too.
6. ~~When the CRM's Task 70 reply is in~~ — **done 2026-09-18.** Contract kept
   exactly; the three additive deviations are applied (see "What the CRM said
   about the Account task"). Brad applied migration 0086; types regenerated.
   The CRM's Task 70 is on its `origin/main` (`05f0648`, the Inbox fix
   `5c58a69`, and `1a492e5` recording 0086 as applied).
7. ~~Prebuild and a dev build~~ — **done 2026-09-18.** `npx expo prebuild` then
   `npx expo run:ios` on the iPhone 17 Pro simulator builds, installs and
   reaches the sign-in screen against Metro — the first time the app has run
   anywhere. Xcode 26.3 needed `patches/expo-modules-jsi+57.1.0.patch` (see
   `CLAUDE.md`); `npm install` applies it.
8. ~~Walk the Account tail signed in~~ — **done 2026-09-18** on the simulator,
   signed in as Brad's mechanic account against `bookmytech.vercel.app`.
   First-run setup, the Account hub, Earnings, Availability, Documents (as far
   as the expiry step, nothing uploaded), Profile, Reviews, Help, and the
   email, password and delete screens all render with live data. Fixed on the
   way: the chart's wash drew as a solid block; a postcode stored without a
   space ("B772RL") printed whole instead of as its district, on Profile,
   Availability and job rows; the Documents badge said "Expiring" for a
   missing document and its banner claimed missing ones block jobs (only a
   grace-period approval does); the bottom sheet was hidden by the keyboard;
   the Help email wrapped mid-word; and `app.json`'s location string used the
   wrong option name, so Expo's generic text shipped.
9. **The end-to-end job test.** Not done by me: Brad was mid-job on BMT-00093
   in the same simulator, and a job's footer buttons move a real booking with
   one tap (begin work, complete and charge). Do it by hand, or tell a session
   to drive while nobody else touches the simulator.
10. **Rebuild before the next device test** (`npx expo prebuild --platform ios`
    then `npx expo run:ios`): the permission strings changed in `app.json`
    and only a prebuild picks them up.
11. ~~Check with the CRM~~ — **explained 2026-09-18, not an app bug.** Job
    00081 (test data) was completed on 27 Aug, its £51 transfer reversed 33 s
    later by since-removed "reverse on dispute" code (commit `527a5fe` took it
    out that afternoon), and the booking was later deleted. So Earnings, the
    Stripe list and `job_count` are all correct. Only the Inbox's "Payout sent ·
    £51" was wrong: it reads two leftover ledger rows that net to zero. The
    CRM offered to delete them. Separately, `/earnings` lists Stripe transfers
    for the mechanic's *current* Connect account only, so a replaced account
    would hide earlier payouts; listing from the ledger's `stripe_transfer_id`s
    would fix it, with no change to the app's contract.

Whenever Brad can: the **end-to-end test on a dev build** under "Still to do
outside the code". Nothing has run on a device yet; the sooner it does, the
less there is to unpick.

### What the CRM said about the inbox task (Task 69, read in full 2026-09-18)

Source: `bookmytech/docs/tasks/69-mechanic-inbox-cases-disputes.md`. Fourteen
routes under `/api/mobile/v1/mechanic/`, paths, fields and shapes exactly as
`docs/inbox-crm-prompt.md` asked. Built, typechecked, unit-tested and
production-built; **not yet called with a real token.**

- **Migration 0085 creates the `resolution_*` tables itself**, as 0032 defined
  them, idempotently. 0032 must never be run: Brad ran it on 2026-09-17, it
  failed on the stale `booking_events` CHECK and rolled back whole. The CRM
  suggests one check that the live CHECK is intact (it should still list
  `revision_sent` and `quote_sent`):

  ```sql
  select pg_get_constraintdef(oid) from pg_constraint
   where conname = 'booking_events_event_type_check';
  ```
- **Deviations from the prompt:** document-expiry pushes and inbox rows follow
  the cron's real milestones — 30 / 7 / 0 days and on expiry, not 30 / 14 / 1.
  The app hard-codes no milestone, so nothing changes here.
- **Additive extras:** refusals may carry a `code` beside `error`; a posted
  message returns `{ id }`; a closed dispute's `can` is all false.
- `inbox/read-all` can return a non-zero `unreadCount` (threads with unread
  messages stay unread). *Already handled:* `(tabs)/inbox.tsx` sets the badge
  from the count the route returns, and never marks a `thread:` row read
  locally. Re-check once it is live rather than assume.
- A bug the CRM fixed on the way: withdrawing a mechanic-raised dispute used to
  mark an unfinished job `completed`; it now restores the status from the
  `dispute_opened` event.

**bmt-customer-app** — not this repo; do it in a customer-app session
- Regenerate types after 0085: `dispute_messages` gains `photos` and
  `visible_to`.
- Render photos in its dispute thread. Until it does, a mechanic's photo message
  shows there as text alone.
- Its dispute responses may now carry an extra `code` field, and a sent message
  an `id`. Both additive — a phone on an older build is unaffected; nothing has
  to change.

### What the CRM said about the Account task (Task 70, 2026-09-18)

Source: `bookmytech/docs/tasks/70-mechanic-account-earnings.md`. Eight routes,
paths and shapes exactly as `docs/account-crm-prompt.md` asked; four cores
extracted (`documents.ts`, `avatar.ts`, `respond.ts`, `earnings-summary.ts`)
with the web actions now wrappers over them. Migration 0086 (mechanic account
deletion: `delete_mechanic_account()` and two columns on `account_deletions`)
applied by Brad. 649 unit tests; **nothing called with a token, no real Stripe
call.**

Deviations, all additive and all applied in the app:
- `payouts[].status` is `paid` or `reversed` — Stripe transfers have no other
  status. The app shows a red "Reversed" pill.
- `payoutsLive` is also false when the Stripe call throws. The app now says
  "Couldn't reach Stripe just now" rather than "no payouts yet" when Connect
  is set up but the list is empty and not live.
- A fifth deletion refusal code, `staff_account`: an admin who also works
  jobs is refused, not deleted.
- `description` reads "… · Job 00123", the house job-number format; there is
  no `BMT-` reference anywhere in the CRM.

Answers: there is no per-mechanic "replied" count — the app counts rows, as
the web does. A replacement upload of the same `doc_type` is a new row; the
newest is current — as the app assumes.

**Follow-up, done (`5c58a69`):** the Inbox used to keep showing an old
document row's "has expired" / "wasn't accepted" item after a replacement was
uploaded. It now reads the newest row per `doc_type`, as the Documents screen
and the grace sweep already did, so a `pending_review` replacement silences
the item it replaces. Nothing changed in the app: the feed is the CRM's.

## Picking up on a new machine

```bash
git clone https://github.com/bradfarrington/bmt-mechanic-app.git
cd bmt-mechanic-app && git checkout inbox      # the latest work — see Branches
npm install
cp .env.example .env                           # then fill in — the three values are
                                               # the same as bmt-customer-app's .env
```

The app reads a lot from two sibling repos, which should sit beside this one:
`bmt-customer-app` (the scaffold, tokens and primitives this app copies) and
`bookmytech` (the CRM — Next.js + Supabase, the shared backend).

`npm run ios` builds a dev client. **Expo Go will not do**: Stripe's return link
only accepts the `bmtmechanic://` and `exp+bmt-mechanic-app://` schemes, and
push needs a dev build on a real phone.

## Branches

Each step is its own branch, **stacked** on the one before. Nothing is merged
to `main` and no PRs are open — `main` still holds only the design mockups.

```
main → scaffold-shell → auth-stack → today-offers → today-extras
     → active-job → job-extras → inbox → account  ← latest; has everything
```

To land it: merge in that order, or merge `account` alone (it contains the rest).

## Build order (`design/README.md`) — status

| # | Step | Branch | State |
|---|------|--------|-------|
| 1 | Scaffold | `scaffold-shell` | done |
| 2 | Tokens | `scaffold-shell` | done |
| 3 | Auth, payouts, first-run setup | `auth-stack` | done |
| 4 | Tab shell + status button | `scaffold-shell` | done |
| 5 | Today & offers, push, arrival window | `today-offers` | done |
| 5b | Daily goal, accept rate, distances, timed offline, Tomorrow, Recap | `today-extras` | done |
| 6 | Active job: Jobs tab, job screen, messages, checklists, quotes, cancel, reschedule, live location | `active-job` | done |
| 6b | Faults, revisions, end on site, part status, running late | `job-extras` | done |
| 7 | Inbox feed, disputes, Get help cases | `inbox` | done |
| 8 | Account: earnings, availability, documents, profile, reviews, help, email, password, delete (no Pro — see Known limits) | `account` | built — **CRM side (Task 70) not yet run**; no fake-data layout check |

"Done" means: typechecks, lints clean, the iOS bundle exports, and the layouts
were checked with fake data in a throwaway web build. **None of it has been run
on a simulator or phone, or against the live CRM** — the sandbox these sessions
ran in cannot reach `bookmytech.vercel.app`.

## The CRM prompts

The CRM had no mechanic mobile API at all. Each step's server work is written
as a prompt in `docs/`, run in a session in the `bookmytech` repo. The app is
built against the contract in each prompt; when the CRM replies, paste the reply
into the app session so any differences get applied.

| Prompt | CRM task | State |
|---|---|---|
| `auth-crm-prompt.md` | 64 | built; migration 0081 applied |
| `offers-crm-prompt.md` | 65 | built; migration 0082 applied |
| `today-crm-prompt.md` | 66 | built; migration 0083 applied; types regenerated |
| `job-crm-prompt.md` | 67 | built (`e54eba7`); migration 0084 is settings rows only — apply when convenient |
| `job-extras-crm-prompt.md` | 68 | built (`38f67bd`); pushed to the CRM's `main` |
| `inbox-crm-prompt.md` | 69 | built (`8bce93b`); migration 0085 applied; types regenerated |
| `account-crm-prompt.md` | 70 | built (`05f0648`), pushed; migration 0086 applied; types regenerated |
| `apply-crm-prompt.md` | 71 | built, on the CRM's `main` (`a639591`); no migration |

## Decisions the owner has made — do not reopen

- **No customer signature.** Completing a job is a two-step "Confirm & charge",
  as on the web. The signature screen in the mockups is not built and the
  Caveat font was removed.
- **Only Book My Tech decides a dispute.** The customer and the mechanic can
  only communicate about one: reply, attach photos, ask BMT to step in, and
  withdraw an issue they raised themselves. No accept-refund, no re-do offer,
  no route that settles or moves money.
- **Build everything.** When a mockup element or a web feature has no data or
  route behind it, write a CRM prompt for it and build against that — do not
  drop it and list it as missing.

## Applying to join (added 2026-09-18)

"Apply to join" on sign-in now opens the application in the app
(`src/app/(auth)/apply/`) instead of the website: the web wizard's four steps
plus review, same fields, rules and copy, held in memory only. CRM Task 71
is live: `POST applications/documents` (needs `X-BMT-Client: mechanic-app`;
10 a minute, 40 a day per IP) and `POST applications` (5 an hour, 10 a day
per IP). A duplicate email is a 409 with a sentence telling them to email
support. Approval is unchanged: the set-password link opens the website, which
now tells them to sign in on the app. Not yet seen on the simulator (it is
only reachable signed out), and no application has been sent from the app.

## Still to do outside the code

Done 2026-09-18: `eas init` (project `@bradbtfx/bmt-mechanic-app`, id
`92bf4d9f-…`, so push is live); a mechanic icon, splash and Android adaptive
icon (the brand mark inverted on the brand gradient, generated from the
customer app's mark — swap in designed artwork whenever); the bundle id
`uk.co.thedigicraft.bmt.mechanic` checked — it follows the customer app's
`uk.co.thedigicraft.bmt.customer`; and Supabase's redirect list already holds
`bmtmechanic://reset-password`, which dev builds use too.

- **Google Maps key for Android** (Brad — needs the Google Cloud console):
  create a key with only "Maps SDK for Android", restricted to the package
  `uk.co.thedigicraft.bmt.mechanic` and the SHA-1s from
  `eas credentials -p android` (they exist after the first Android build).
  Put it in `.env` as `GOOGLE_MAPS_ANDROID_API_KEY` for local builds and in EAS
  (`eas env:create --name GOOGLE_MAPS_ANDROID_API_KEY --visibility sensitive`)
  for cloud ones. `app.config.ts` does the rest. Until then Android's map is grey.
- **Android has never been built.** `npm run android` once the key is in.
- **Supabase's Site URL is `http://localhost:3000`**, and
  `bookmytech.vercel.app` is not on its redirect list. The app is unaffected;
  the CRM's own emailed links (password reset, mechanic invites) fall back to
  the Site URL whenever their `redirectTo` is not listed. A CRM-side check.
- Photo picking asks for **full** photo-library access first
  (`requestMediaLibraryPermissionsAsync`), in Documents, Profile and the
  evidence picker. iOS's own picker needs no permission at all, so that
  prompt could be dropped on iOS — kinder, and one less thing for App Review.
  Not changed yet: it touches three screens and wants a device test.
- Metro prints `Sending onAnimatedValueUpdate with no listeners registered`
  repeatedly on the sign-in screen — a React Native warning from an Animated
  value without a listener, most likely the status button's pulse. Cosmetic;
  find and silence it.
- **In `bmt-customer-app`** (a customer-app session, not this one):
  `npm run db:types` — its types predate migrations 0083 and 0085 — and render
  photos on dispute *replies*; it shows the photos attached when a dispute is
  opened, but not those on `dispute_messages`.
- **A real end-to-end test.** Sign in as a test mechanic on a dev build and take
  one job from offer → accepted → en route → in progress → completed. The CRM
  has asked for this after every task; it has not been done once.

## Known limits, on purpose

- Live location is shared only while the job screen is open (foreground). True
  background sharing needs the "always" location permission.
- The web target exists only for layout checks; a static web export fails on
  `window` inside supabase-js (see `CLAUDE.md`).
- The Help centre offers email and "Raise a case" only. The mockup's Chat and
  Phone tiles have no support chat, number or hours behind them anywhere in the
  CRM; add them to `src/app/(app)/help.tsx` when real ones exist.
- **No Go Pro screen** (owner decision 2026-09-18). Mockup frame 7 is not
  built: `mechanics.is_pro` is an admin-set flag with no criteria, no path to
  it and a `take_rate_pro` the pricing engine never applies. If the tier is
  ever built in the CRM, it gets its own prompt and screen.
- Earnings draws no "next payout": mechanics are paid per job on completion
  (owner decision 2026-07-01). The web page's weekly payout preview and its
  `•••• 4242` were placeholder UI and were not ported.

## Next: nothing left to build — verify

Every step of `design/README.md`'s build order is built. What is left is the
CRM's Task 70, then the end-to-end test on a dev build under "Still to do
outside the code". Step 8's screens in particular have never rendered anywhere
but the type checker: run them with a real mechanic, and expect small layout
fixes on Earnings (the hero and the chart) and Documents (the sheets).
