# Mechanic mobile API (the rest of the job page) — prompt for the CRM repo

Fifth of the mechanic-app prompts. Needs Task 67 in. It covers what Task 67
left web-only: faults, job revisions, ending a job on site, part status and
moving several jobs at once. The owner needs all of them in the app.

> Read `/Users/bradfarrington/Downloads/bmt-mechanic-app/docs/job-extras-crm-prompt.md`
> and do everything below the horizontal rule in it.

---

## Context

Same house pattern as Task 67: `readJsonBody` first,
`mobileMechanicCaller(request, family)`, `isUuid`, delegate to the shared
`lib/` core with the mechanic id passed in, `refusalResponse` / `apiOk`.
Refusal sentences pass through verbatim. Same emails, SMS, pushes and
`booking_events` as the web. **Keep the paths, field names and shapes below, or
tell me what you changed.** All paths are under `/api/mobile/v1/mechanic`.

The app reads `booking_faults` itself (RLS gives an assigned mechanic SELECT).
Everything about revisions comes through the routes below — a snapshot is too
much shape for the app to assemble, and none of the pricing is the app's to do.

## 1. Faults (`mechanic`)

- `POST /bookings/[id]/faults` — `{ "description": "…", "severity": "advisory" | "urgent" }`
  → `{ "id": "…" }`. Twin of `addFault`.
- `POST /faults/[faultId]/remove` → `{}`. Twin of `deleteFault`.
- Task 67's `POST /bookings/[id]/quotes` must accept an optional `faultId` on a
  line, as `job_quote_lines.fault_id` — the app's "Quote for this" on a fault
  prefills a line from it. Say if it already does.

## 2. Job revisions — "Change what's being done"

### `GET /bookings/[id]/revision` (`mechanicfeed`)

Everything the app needs to draw the panel, so it never rebuilds a snapshot:

```jsonc
{
  // What is on the job now — the `before` snapshot, trimmed to what is shown.
  "current": {
    "repairs": [{ "id": "<catalogue id, as RevisionInput.repairIds takes it>", "description": "Front brake pads & discs", "linePence": 9900 }],
    "parts":   [{ "id": "<booking_parts.id>", "name": "Brake pads (Bosch)", "quantity": 1, "unitPence": 4500, "linePence": 4500, "sourcing": "bmt" }],
    "totalPence": 18000,
    "mechanicPayoutPence": 7200
  },
  // Newest first. `summary` is one line the app can print as-is, e.g.
  // "Removed Front discs · added Rear pads".
  "revisions": [{
    "id": "…", "status": "sent",            // RevisionStatus
    "statusLabel": "Waiting for the customer",
    "reason": "…", "note": null, "summary": "…",
    "differencePence": -3600,
    "sentAt": "…", "expiresAt": "…", "respondedAt": null
  }],
  // Whether a new revision could be sent right now, and if not, the sentence
  // sendRevision would refuse with.
  "canRevise": true,
  "reviseBlocker": null,
  // Present only when endJobOnSite would be allowed (the customer has declined
  // a revision) — onSiteFeeOptions(), so labels and amounts are the CRM's.
  "onSiteOptions": [{ "kind": "diagnostic", "label": "…", "hint": "…", "pence": 4500 }]
}
```

### The rest

| Route | Twin of | Body | 200 |
|---|---|---|---|
| `GET /bookings/[id]/catalogue?query=…` (`mechanicfeed`) | `searchJobCatalogue` | — | `{ "hits": CatalogueHit[], "truncated": boolean }` |
| `POST /bookings/[id]/revision/preview` (`mechanicfeed`) | `previewRevision` | `{ "repairIds": string[], "parts": RevisionPartInput[] }` | below |
| `POST /bookings/[id]/revision` (`mechanic`) | `sendRevision` | the same, plus `"reason": "…", "note"?: "…"` | `{ "id": "…" }` |
| `POST /revisions/[revisionId]/withdraw` (`mechanic`) | `withdrawRevision` | — | `{}` |
| `POST /bookings/[id]/end-on-site` (`mechanic`) | `endJobOnSite` | `{ "charge": "diagnostic" \| "cancellation" \| "none", "note"?: "…" }` | `{ "status": "…", "chargedPence": 4500, "payoutPence": 3825 }` |

Preview answers with `RevisionPreview` trimmed to what the app shows:

```jsonc
{
  "before": { "totalPence": 18000, "mechanicPayoutPence": 7200, "serviceDurationHours": 1.25 },
  "after":  { "totalPence": 14400, "mechanicPayoutPence": 5400, "serviceDurationHours": 1 },
  "diff": {
    "differencePence": -3600,
    "direction": "…",                        // RevisionDirection, as it is
    "durationChange": -0.25,
    "lines": { "added": [{ "description": "…", "linePence": 0 }], "removed": [...], "kept": [...] },
    "parts": { "added": [{ "name": "…", "quantity": 1, "linePence": 0 }], "removed": [...], "kept": [...] }
  }
}
```

It is called as the mechanic edits, so a draft that cannot be priced yet is
expected — 400 with the sentence. `end-on-site` moves money: make it as safe
against a double call as `complete` now is.

## 3. Part status (`mechanic`)

`POST /booking-parts/[partId]/status` — `{ "status": "ordered" | "delivered" | "used" }`
→ `{}`. Twin of `markPartStatus`.

## 4. Running late — move several jobs at once (`mechanic`)

`POST /reschedules` — `{ "items": [{ "bookingId": "…", "newIso": "…" }], "note": "…" }`
→ `{ "proposed": 2, "failed": [{ "bookingId": "…", "error": "…" }] }`. Twin of
`proposeReschedules`, same 20-item cap. The app offers the web's four pushes
(30 min, 1 h, 2 h, 3 h) over today's remaining confirmed jobs and rounds up to
15 minutes the way `running-late.tsx` does.

## Also tell me

- What `RevisionDirection`'s values are, and how the customer-facing copy
  describes each — the app's preview should use the same words.
- Whether a follow-on quote (`kind: "follow_on"`) sent after a trimmed job is
  pre-filled server-side or by the web panel. The app sends `follow_on` quotes
  through Task 67's route; if the pre-fill is the panel's, give me a
  `GET /bookings/[id]/follow-on-draft` → `{ "title", "note", "lines": QuoteLineInput[] }`.

## Done when

- A mechanic's token can add and remove a fault; preview, send and withdraw a
  revision; end a declined job on site with each charge option; mark a part
  ordered → delivered → used; and move two jobs in one call.
- Two overlapping `end-on-site` calls pay the mechanic once.
- A customer's token gets 403 everywhere; another mechanic's gets 403/404.
- The web job page behaves exactly as before.
