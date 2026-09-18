# Mechanic mobile API (applying to join) — prompt for the CRM repo

Eighth mechanic-app prompt. The owner wants "Apply to be a mechanic" inside the
app, not a link to the website. It is the web wizard at `/mechanics/apply`
done natively: the same four steps, the same fields and rules, the same row in
`mechanic_applications`, the same emails. Nothing about review, approval or
the set-password invite changes.

> Read `/Users/bradfarrington/Downloads/bmt-mechanic-app/docs/apply-crm-prompt.md`
> and do everything below the horizontal rule in it.

---

## Context

`app/actions/submit-application.ts` has two anonymous server actions on the
service role — `uploadApplicationDoc` and `submitApplication` — and neither is
rate limited. Move both into a shared core (say `lib/applications/submit.ts`)
that the actions and two new mobile routes call, so the web and the app cannot
drift. **Keep the paths, field names and shapes below, or tell me what you
changed.** Both routes are under `/api/mobile/v1` and take **no** session:
the applicant has no account yet.

## 1. `POST /applications/documents` — one document, multipart

Fields `draftId` (a UUID the app mints once per application), `docType`
(`photo_id` | `public_liability_insurance` | `trade_insurance` |
`qualification` | `vat`) and `file` → `{ "path": "applications/<draftId>/<docType>.<ext>" }`.
Twin of `uploadApplicationDoc`: same bucket, path, 10 MB cap, pdf/jpeg/png/webp,
`upsert: true`, same refusal sentences as a non-2xx `{ error }`.

It is anonymous and multipart, so it has neither of the usual guards — no
Bearer token, and `readJsonBody`'s content-type rule does not apply. Give it
both of these:

- **Require the header `X-BMT-Client: mechanic-app`** and answer 400 without
  it. A custom header is not CORS-simple, so a browser must preflight it, and
  no route answers a preflight — the same protection `application/json` gives
  the JSON routes.
- **An IP limit** — a new family, e.g. `mobile_applydoc_ip_burst` /
  `_ip_daily`, sized for one person uploading five documents and replacing a
  couple (a burst of ~10, a day of ~40), plus a global daily ceiling. Fail
  closed like every other limit.

Storage errors should not reach the applicant raw; give a sentence.

## 2. `POST /applications` — submit, JSON

```jsonc
{
  "draftId": "…",
  "fullName": "…", "email": "…", "phone": "…", "postcode": "…",
  "yearsExperience": 8,                        // or null
  "businessType": "sole_trader" | "limited_company",
  "businessName": "…", "businessNumber": "…",
  "vatRegistered": false,
  "specialisms": ["full-service", "diagnostic"],
  "serviceRadiusMiles": 10,
  "docs": { "photo_id": "applications/<draftId>/photo_id.jpg" },  // only those uploaded
  "bankSortCode": "123456", "bankAccountNumber": "12345678",
  "references": [
    { "name": "…", "relationship": "…", "email": "…", "phone": "…" },
    { "name": "", "relationship": "", "email": "", "phone": "" }
  ]
}
```

→ 201 `{ "applicationId": "…" }`, or a non-2xx `{ error }` with the core's
sentence (409 for "An application with that email already exists.").

`readJsonBody` first, then an IP limit (a family like `mobile_apply_ip_*`, a
handful an hour, sized like `mobile_signup`), then the core. While moving the
validation into the core, make the server enforce what today only the web page
does, so the app cannot send what the website would stop:

- business type, business name and business number present;
- at least one specialism, every one a slug from `lib/specialisms.ts`;
- `yearsExperience` null or 0–70;
- **every `docs` path starts with `applications/<draftId>/` and names its own
  type** — today any string is stored, so a crafted submit could point an
  application at someone else's file;
- `vat` only when `vatRegistered`.

Same insert, same encryption of the bank fields, same `application_received`
and `admin_new_application` emails. The app sends no `sourceAreaSlug`.

## 3. After approval

The invite's set-password link only works on the website (`/auth/callback`
sets cookies and `safeNext` refuses another scheme), and that is fine: the
applicant sets a password there and signs in to the app. But the page they
land on afterwards should say so. On `/mechanic/set-password`, once a password
is set, add a line along the lines of "Now sign in on the BMT Mechanic app with
this email and password." Nothing else about the invite changes.

## Also tell me

- Whether a rejected applicant really can never reapply with the same email
  (the UNIQUE constraint on `email` suggests so). The app will show the 409
  sentence as it comes, so make that sentence say what to do next — e.g.
  "…already exists. If you've been rejected before or need to update it, email
  support@bookmytech.co.uk."
- Whether an address that already belongs to a mechanic should be refused at
  submit rather than only at approval.

## Done when

- The app, with no session, can upload each document type to a draft and
  submit an application that lands in the admin approvals queue with its
  documents, exactly as a web application does, and both emails go.
- A multipart upload without `X-BMT-Client` is refused; both routes refuse
  past their IP limits.
- A submit whose `docs` path belongs to another draft is refused.
- The web wizard behaves as before, and now also refuses what the new server
  checks refuse.
