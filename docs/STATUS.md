# Where we are — BMT mechanic app

Last updated **2026-09-17**, end of day. Read this first when picking the work
up, on this machine or a new one. `CLAUDE.md` explains how the code is laid
out; `design/README.md` has the mockup → screen map and the build order.

## Start here next session

In this order. Tick them off and update this file as you go.

1. **Get the rest of the CRM's reply to the inbox prompt**
   (`docs/inbox-crm-prompt.md`). Only its last section has been seen — it is
   recorded below. Brad pastes the full reply into the app session. Apply whatever it says it changed — paths, field
   names, refusal codes — in `src/lib/inbox.ts`, `src/lib/disputes.ts`,
   `src/lib/cases.ts`, `src/lib/uploads.ts` and the screens that use them.
2. **Brad applies the SQL it gives** — migration 0085. It should also cover CRM
   migration 0032:
   production has no `resolution_reasons` / `resolution_cases` /
   `resolution_messages` tables, so "Get help" cannot work until it is applied.
   If the reply does not mention 0032, ask the CRM session about it again.
3. **`npm run db:types`**, then remove the two stand-ins:
   - `src/lib/cases.ts` — the hand-written `CaseReason` / `HelpCase` /
     `CaseMessage` types and the untyped `db` client → use the generated types.
   - `src/lib/disputes.ts` — the defensive read of `dispute_messages.photos` /
     `visible_to` in `fetchDisputeThread`.
   Then `npx tsc --noEmit`, `npm run lint`, commit and push to `inbox`.
4. **Check CRM Task 68 is live.** Commit `38f67bd` (faults, revisions, end on
   site, part status, running late) was not pushed or deployed when it was
   reported. Until it is, those screens answer with an error.
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

### What the CRM said about the inbox task (received 2026-09-17, tail only)

Only the closing "Work needed in the app repos" section reached the app
session — **the rest of the reply (what it built, what it changed from the
prompt, the SQL to apply, whether 0032 is in it) still needs pasting in.** The
migration is **0085**.

**bmt-mechanic-app**
- Regenerate types after 0085 (`npm run db:types`) — step 3 above.
- "Mark all read" can return a non-zero count, because threads with unread
  messages stay unread. *Already handled:* `(tabs)/inbox.tsx` sets the badge
  from the count the route returns, and never marks a `thread:` row read
  locally. Re-check once it is live rather than assume.

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
| `job-extras-crm-prompt.md` | 68 | built (`38f67bd`) — **was not pushed/deployed when reported; check** |
| `inbox-crm-prompt.md` | 69? | built, migration **0085** — only the tail of its reply seen; full reply, SQL and 0032 still to confirm |

### When the inbox prompt's reply comes back

1. Paste it into the app session; apply whatever it changed.
2. Apply the SQL it gives. **It should include CRM migration 0032** — production
   has no `resolution_reasons` / `resolution_cases` / `resolution_messages`
   tables, so the website's "Get help" has never worked there either.
3. `npm run db:types`, then in `src/lib/cases.ts` replace the hand-written
   `CaseReason` / `HelpCase` / `CaseMessage` types and the untyped `db` client
   with the generated ones, and in `src/lib/disputes.ts` drop the defensive
   read of `dispute_messages.photos` / `visible_to`.

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
