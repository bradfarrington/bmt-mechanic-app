import * as Crypto from 'expo-crypto';
import type { LucideIcon } from 'lucide-react-native';
import { Award, IdCard, Receipt, Shield, ShieldCheck } from 'lucide-react-native';

import { api, rateLimitMessage } from '@/lib/api';
import type { PickedFile } from '@/lib/uploads';

/**
 * Applying to join — the CRM's web wizard at `/mechanics/apply`, done in the
 * app. Same four steps, same fields, the same rules and error copy (from its
 * `step-*.tsx` and `submit-application.ts`), and the same row in
 * `mechanic_applications`. Review, approval and the set-password invite are
 * unchanged and happen on the CRM's side; see `docs/apply-crm-prompt.md`.
 *
 * The applicant has no account, so both calls go out without a token. The
 * upload is multipart and anonymous, which leaves it with neither of the CRM's
 * usual guards against a web page posting to it — so it carries an app-only
 * header, which a browser would have to preflight and the CRM never answers.
 */

const CLIENT_HEADER = { 'X-BMT-Client': 'mechanic-app' } as const;

export type BusinessType = 'sole_trader' | 'limited_company';

export interface Reference {
  name: string;
  relationship: string;
  email: string;
  phone: string;
}

export type AppDocType =
  | 'photo_id'
  | 'public_liability_insurance'
  | 'trade_insurance'
  | 'qualification'
  | 'vat';

export interface ApplicationDraft {
  /** Minted once per application; the uploads live under it. */
  draftId: string;
  fullName: string;
  email: string;
  phone: string;
  postcode: string;
  /** Free text in the field; sent as a number or null. */
  yearsExperience: string;
  businessType: BusinessType | null;
  businessName: string;
  businessNumber: string;
  vatRegistered: boolean;
  specialisms: string[];
  serviceRadiusMiles: number;
  /** Storage paths the CRM returned, by type. */
  docs: Partial<Record<AppDocType, { path: string; fileName: string }>>;
  bankSortCode: string;
  bankAccountNumber: string;
  references: [Reference, Reference];
}

const EMPTY_REFERENCE: Reference = { name: '', relationship: '', email: '', phone: '' };

export function newDraft(): ApplicationDraft {
  return {
    draftId: Crypto.randomUUID(),
    fullName: '',
    email: '',
    phone: '',
    postcode: '',
    yearsExperience: '',
    businessType: null,
    businessName: '',
    businessNumber: '',
    vatRegistered: false,
    specialisms: [],
    serviceRadiusMiles: 10,
    docs: {},
    bankSortCode: '',
    bankAccountNumber: '',
    references: [{ ...EMPTY_REFERENCE }, { ...EMPTY_REFERENCE }],
  };
}

/** The web wizard's five steps, in order — the stepper's labels. */
export const APPLY_STEPS = ['About you', 'Your business', 'Your work', 'Documents', 'Review'] as const;

export const BUSINESS_TYPES: readonly { value: BusinessType; label: string }[] = [
  { value: 'sole_trader', label: 'Sole trader' },
  { value: 'limited_company', label: 'Limited company' },
];

/** The application's radius, which the CRM allows from 1 to 100 miles. */
export const APPLY_RADIUS_MIN = 1;
export const APPLY_RADIUS_MAX = 100;

export interface AppDocDef {
  type: AppDocType;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** Shown only when VAT registered. */
  vatOnly?: boolean;
}

/** `DOC_DEFS` in the CRM's `lib/onboarding/docs.ts`. All optional at this stage. */
export const APP_DOCS: readonly AppDocDef[] = [
  { type: 'photo_id', label: 'Photo ID', hint: 'Passport or driving licence', icon: IdCard },
  {
    type: 'public_liability_insurance',
    label: 'Public liability insurance',
    hint: 'Certificate (PDF or image)',
    icon: Shield,
  },
  { type: 'trade_insurance', label: 'Trade insurance', hint: 'Certificate (PDF or image)', icon: ShieldCheck },
  { type: 'qualification', label: 'Trade qualification', hint: 'NVQ, IMI, City & Guilds, etc.', icon: Award },
  { type: 'vat', label: 'VAT registration document', hint: "Only if you're VAT registered", icon: Receipt, vatOnly: true },
];

// The web wizard's checks, one error at a time, in its words.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTCODE_SHAPE = /^[A-Z]{1,2}[0-9][A-Z0-9]?(\s?[0-9][A-Z]{2})?$/i;

export function checkAbout(d: ApplicationDraft): string | null {
  if (!d.fullName.trim()) return 'Please enter your full name.';
  if (!EMAIL_SHAPE.test(d.email.trim())) return 'Please enter a valid email address.';
  if (!d.phone.trim()) return 'Please enter a phone number.';
  if (!POSTCODE_SHAPE.test(d.postcode.trim())) return 'Please enter a valid UK postcode.';
  const years = d.yearsExperience.trim();
  if (years && (!/^\d{1,2}$/.test(years) || Number(years) > 70)) {
    return 'Years of experience should be a number from 0 to 70.';
  }
  return null;
}

export function checkBusiness(d: ApplicationDraft): string | null {
  if (!d.businessType) return 'Please choose how you operate.';
  if (!d.businessName.trim()) return 'Please enter your business name.';
  if (!d.businessNumber.trim()) {
    return d.businessType === 'limited_company'
      ? 'Please enter your company number.'
      : 'Please enter your UTR.';
  }
  return null;
}

export function checkWork(d: ApplicationDraft): string | null {
  if (!d.specialisms.length) return 'Pick at least one thing you work on.';
  return null;
}

export const digitsOf = (value: string) => value.replace(/[\s-]/g, '');

export function checkDocuments(d: ApplicationDraft): string | null {
  if (!/^\d{6}$/.test(digitsOf(d.bankSortCode))) return 'Sort code must be 6 digits.';
  if (!/^\d{8}$/.test(digitsOf(d.bankAccountNumber))) return 'Account number must be 8 digits.';
  return null;
}

/** The first thing stopping a submit, and the step it belongs to. */
export function firstProblem(d: ApplicationDraft): { step: StepRoute; error: string } | null {
  const checks: [StepRoute, (d: ApplicationDraft) => string | null][] = [
    ['/apply', checkAbout],
    ['/apply/business', checkBusiness],
    ['/apply/work', checkWork],
    ['/apply/documents', checkDocuments],
  ];
  for (const [step, check] of checks) {
    const error = check(d);
    if (error) return { step, error };
  }
  return null;
}

export type StepRoute = '/apply' | '/apply/business' | '/apply/work' | '/apply/documents';

type Failure = { ok: false; error: string };

function failure(status: number, error: string, retryAfter?: number): Failure {
  return { ok: false, error: status === 429 ? rateLimitMessage(retryAfter) : error };
}

/** The CRM's caps, checked before a byte is sent. */
export const MAX_APP_DOC_BYTES = 10 * 1024 * 1024;
const APP_DOC_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

/** One document, uploaded as soon as it is picked, as on the web. */
export async function uploadApplicationDoc(
  draftId: string,
  docType: AppDocType,
  file: PickedFile & { size?: number | null },
): Promise<{ ok: true; path: string } | Failure> {
  const mime = file.mimeType ?? 'image/jpeg';
  if (!APP_DOC_MIME.includes(mime)) return { ok: false, error: 'Use a PDF, JPG, PNG or WebP file.' };
  if (file.size != null && file.size > MAX_APP_DOC_BYTES) {
    return { ok: false, error: 'File must be 10 MB or smaller.' };
  }

  const form = new FormData();
  form.append('draftId', draftId);
  form.append('docType', docType);
  form.append('file', {
    uri: file.uri,
    type: mime,
    name: file.fileName ?? `${docType}.${mime === 'application/pdf' ? 'pdf' : 'jpg'}`,
  } as unknown as Blob);

  const response = await api.upload<{ path: string }>('/applications/documents', form, {
    auth: 'none',
    headers: CLIENT_HEADER,
  });
  return response.ok
    ? { ok: true, path: response.data.path }
    : failure(response.status, response.error, response.retryAfter);
}

/** Send the application. The CRM emails a confirmation and alerts the team. */
export async function submitApplication(
  d: ApplicationDraft,
): Promise<{ ok: true; applicationId: string } | Failure> {
  const years = d.yearsExperience.trim();
  const docs = Object.fromEntries(
    Object.entries(d.docs)
      .filter(([type]) => d.vatRegistered || type !== 'vat')
      .map(([type, doc]) => [type, doc?.path]),
  );

  const response = await api.post<{ applicationId: string }>(
    '/applications',
    {
      draftId: d.draftId,
      fullName: d.fullName.trim(),
      email: d.email.trim().toLowerCase(),
      phone: d.phone.trim(),
      postcode: d.postcode.trim().toUpperCase(),
      yearsExperience: years ? Number(years) : null,
      businessType: d.businessType,
      businessName: d.businessName.trim(),
      businessNumber: d.businessNumber.trim(),
      vatRegistered: d.vatRegistered,
      specialisms: d.specialisms,
      serviceRadiusMiles: d.serviceRadiusMiles,
      docs,
      bankSortCode: digitsOf(d.bankSortCode),
      bankAccountNumber: digitsOf(d.bankAccountNumber),
      references: d.references.map((r) => ({
        name: r.name.trim(),
        relationship: r.relationship.trim(),
        email: r.email.trim().toLowerCase(),
        phone: r.phone.trim(),
      })),
    },
    { auth: 'none' },
  );
  return response.ok
    ? { ok: true, applicationId: response.data.applicationId }
    : failure(response.status, response.error, response.retryAfter);
}
