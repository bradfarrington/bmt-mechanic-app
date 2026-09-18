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
5. **Start step 8, the Account tail**, on a new branch `account` off `inbox` —
   see "Next" at the bottom of this file. Same routine as every other step:
   read the mockup, read how the CRM's web mechanic pages do it, write
   `docs/account-crm-prompt.md`, build the app against it, check the layouts
   with fake data, commit and push, hand Brad the one-line prompt to run.
6. When step 8 lands, point `src/lib/links.ts` at the real earnings, reviews and
   documents screens instead of the Account tab.

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
     → active-job → job-extras → inbox            ← latest; has everything
```

To land it: merge in that order, or merge `inbox` alone (it contains the rest).

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
| 7 | Inbox feed, disputes, Get help cases | `inbox` | done — **CRM side in progress** |
| 8 | Account: earnings, availability, documents, profile, reviews, Pro, help | — | **next** |

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

## Still to do outside the code

- `eas init` — until the app has an EAS project id, push is switched off and
  its prompts stay hidden.
- Confirm the bundle id `uk.co.thedigicraft.bmt.mechanic`; replace the app icon
  and splash, which are copies of the customer app's.
- Supabase → Authentication → URL Configuration → Redirect URLs: add
  `bmtmechanic://reset-password` (and `exp+bmt-mechanic-app://reset-password`
  for dev builds), or "Forgot password?" opens the website instead of the app.
- In `bmt-customer-app`: `npm run db:types` (migration 0083 added columns).
- Android needs a Google Maps key in the `react-native-maps` config plugin
  before the en-route map shows anything but grey.
- **A real end-to-end test.** Sign in as a test mechanic on a dev build and take
  one job from offer → accepted → en route → in progress → completed. The CRM
  has asked for this after every task; it has not been done once.

## Known limits, on purpose

- Live location is shared only while the job screen is open (foreground). True
  background sharing needs the "always" location permission.
- The web target exists only for layout checks; a static web export fails on
  `window` inside supabase-js (see `CLAUDE.md`).
- `src/lib/links.ts` sends inbox rows and pushes for earnings, reviews and
  documents to the Account tab until step 8 builds those screens.

## Next: step 8, the Account tail

Mockup `design/mockups/05-account-earnings.html`. Start the same way as the
other steps: read how the CRM's web mechanic pages do earnings
(`mechanic_ledger`, readable under RLS), availability (already written direct
by onboarding — `src/lib/mechanic.ts`), documents (`mechanic_documents`: insert
allowed under RLS, but the `mechanic-docs` bucket is private and uploads go
through the service role), profile and avatar, reviews (and the mechanic's
response to one), Pro, and help — then write `docs/account-crm-prompt.md` for
whatever is cookie-only, and build against it.
