# Mechanic mobile API (Today extras) — prompt for the CRM repo

Third of the mechanic-app prompts. Needs `requireMobileMechanic` and the offers
work (Tasks 64 and 65) already in.

> Read `/Users/bradfarrington/Downloads/bmt-mechanic-app/docs/today-crm-prompt.md`
> and do everything below the horizontal rule in it.

---

## Context

The app's Today screen is live, but five things in the design have no data
behind them: the daily-goal ring, accept rate, distance on the mechanic's own
jobs, timed "come back online" options, and the "Tomorrow at a glance" / "End of
day" screens that open from a push. The app side is built against the contract
below — **keep the field names and shapes exactly**, or say what you changed.

Same conventions as before: `requireMobileMechanic`, `apiOk` / `apiError` /
`readJsonBody`, rate-limit families seeded by migration, shared functions rather
than copied logic, London time for every "day".

## 1. Migration

On `public.mechanics`:

- `daily_goal_pence integer null check (daily_goal_pence between 1000 and 200000)`
  — the mechanic's own target. **Writable by the mechanic under RLS**, like
  `service_radius_miles`; make sure the 0081 column guard lets it through. The
  app writes it directly with supabase-js.
- `resume_online_at timestamptz null` — when a timed offline ends. **Not**
  writable by the mechanic: add it to the columns the 0081 guard refuses. Only
  the status route and the cron below set it. The app reads it off its own row.

## 2. `GET /api/mobile/v1/mechanic/summary?day=YYYY-MM-DD`

`day` is a London calendar day; default today. 400 on a malformed day. Polled at
most on Today's focus and pull-to-refresh, so the ordinary read limit is fine.

```jsonc
{
  "dayKey": "2026-09-17",
  // The mechanic's assigned bookings scheduled that London day, any status but
  // cancelled. Straight line from their base postcode, same helper as the offer
  // summaries; null when either end won't geocode.
  "jobs": [{ "bookingId": "…", "distanceMiles": 1.2 }],
  // When to set off for the first open job of the day, and where it is
  // (postcode district). Start of its window minus travel time. Pick a simple,
  // documented rule — e.g. straight-line miles at 20 mph plus 10 minutes,
  // rounded down to 5 — and return null when it can't be worked out or the day
  // has no open job. Tell me the rule you chose.
  "leaveBy": { "iso": "2026-09-18T07:00:00.000Z", "area": "SE21" },
  // Last 30 days of this mechanic's job_offers: accepted / (accepted +
  // declined). Superseded and pending offers count as neither. percent is a
  // whole number, null when answered is 0.
  "acceptRate": { "percent": 88, "accepted": 22, "answered": 25, "windowDays": 30 },
  // Totals for `day`, for the end-of-day recap.
  "totals": {
    "earnedPence": 24800,        // mechanic_payout_pence over completed jobs
    "bookedPence": 34000,        // … over every job in `jobs`
    "completedJobs": 4,
    "workedMinutes": 405,        // sum of completed_at - started_at
    "distanceMiles": 14.2        // base → job 1 → job 2 … in scheduled order, straight lines; null if any leg won't geocode
  }
}
```

## 3. Timed offline — extend `POST /api/mobile/v1/mechanic/status`

Body gains an optional `resume`, only meaningful with `status: "offline"`:

```jsonc
{ "status": "offline", "resume": { "minutes": 30 } }      // 30 or 60 only
{ "status": "offline", "resume": { "at": "next_shift" } } // start of their next active mechanic_availability day, London time
{ "status": "offline" }                                    // indefinitely, as today
{ "status": "online" }                                     // also clears resume_online_at
```

Response becomes `{ "status": …, "resumeAt": string | null }`. 400 for any other
`minutes`; 409 `"Set your working hours first."` for `next_shift` with no active
day. A mechanic who is **already offline** may call this to set, change or clear
`resume` — it is how "come back online in 30 min" works from the offline screen.

New cron `app/api/cron/resume-online`, every 5 minutes (add to `vercel.json`):
for each mechanic with `status = 'offline'` and `resume_online_at <= now()`, go
online through the **same shared function** the status route uses — payouts
gate, suspension check, `online_at`, `redispatchPending()` — then clear
`resume_online_at`. If the gate refuses, clear it anyway and don't retry. Send
`sendPushToMechanic` — title "You're back online", body "We'll send offers
through as they come in.", `data: { "type": "status" }`.

Any other path that sets a mechanic online or on a job must also clear
`resume_online_at`.

## 4. Two new pushes

Both on a **separate Android channel, `updates`** (default importance) — not
`offers`, which is max-importance and reserved for the race. The app creates
both channels.

- **Tomorrow at a glance.** New cron at 20:00 London (Vercel crons are UTC —
  handle BST, e.g. run hourly and act only in the 20:00 London hour). For each
  mechanic with at least one non-cancelled job tomorrow and a registered device:
  title "Tomorrow at a glance", body "4 jobs · £340 · first at 08:30 in SE21",
  `data: { "type": "tomorrow", "day": "YYYY-MM-DD" }`. Once per mechanic per day.
- **End of day.** In the shared complete-and-charge function, after a job
  completes: if the mechanic has no other job still `confirmed`, `en_route` or
  `in_progress` scheduled that London day, send title "Job well done", body
  "You earned £248 today across 4 jobs.",
  `data: { "type": "recap", "day": "YYYY-MM-DD" }`. Once per mechanic per day.

The app deep-links `tomorrow` → `bmtmechanic://tomorrow?day=…` and `recap` →
`bmtmechanic://recap?day=…`, and loads both from `/mechanic/summary` plus its
own RLS read of the bookings.

## Done when

- `GET /mechanic/summary` returns the shape above for a mechanic; 403 for a customer.
- A mechanic can update their own `daily_goal_pence` with the anon-key client,
  and **cannot** update `resume_online_at`.
- Offline with `{ "minutes": 30 }` sets `resume_online_at`; the cron brings them
  back online and re-dispatches; going online by hand clears it.
- Both pushes arrive once, on the `updates` channel, with the `data` above.
- The web mechanic surface behaves exactly as before.
