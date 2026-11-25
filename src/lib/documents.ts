import type { LucideIcon } from 'lucide-react-native';
import { Award, IdCard, Receipt, Shield, ShieldCheck } from 'lucide-react-native';

import type { Tone } from '@/constants/theme';
import { api, rateLimitMessage } from '@/lib/api';
import { putToSignedUpload } from '@/lib/direct-upload';
import { dayInstant, londonDayKey } from '@/lib/london-time';
import { supabase } from '@/lib/supabase';
import type { PickedFile } from '@/lib/uploads';
import type { Database } from '@/types/database';

/**
 * The documents BMT checks before a mechanic can be dispatched. The list is a
 * direct read under RLS, as on the web; the upload and the signed link to
 * view one go through the CRM, because the `mechanic-docs` bucket is private
 * and takes no writes from a mechanic's session.
 */

export type DocumentRow = Pick<
  Database['public']['Tables']['mechanic_documents']['Row'],
  'id' | 'doc_type' | 'status' | 'expires_at' | 'uploaded_at'
>;

/** The CRM's `doc_type` CHECK, in the order the page shows them. */
export type DocType = 'id' | 'public_liability_insurance' | 'trade_insurance' | 'qualification' | 'vat';

export interface DocTypeDef {
  type: DocType;
  label: string;
  icon: LucideIcon;
  /** Whether BMT expects an expiry date on this one. */
  expires: boolean;
  /**
   * One of the four the CRM's grace sweep counts (`requiredDocTypes`); VAT is
   * added there only for a VAT-registered mechanic. Missing ones are enforced
   * only for a mechanic approved with a grace period, whose deadline the app
   * cannot read (applications are admin-only), so the wording never threatens.
   */
  required: boolean;
  hint: string;
}

/** Mirrors `MECHANIC_DOC_DEFS` in the CRM's `lib/onboarding/docs.ts`. */
export const DOC_TYPES: readonly DocTypeDef[] = [
  { type: 'id', label: 'Photo ID', icon: IdCard, expires: true, required: true, hint: 'Passport or driving licence' },
  {
    type: 'public_liability_insurance',
    label: 'Public liability insurance',
    icon: Shield,
    expires: true,
    required: true,
    hint: 'Keeps you dispatchable',
  },
  {
    type: 'trade_insurance',
    label: 'Trade insurance',
    icon: ShieldCheck,
    expires: true,
    required: true,
    hint: 'Keeps you dispatchable',
  },
  {
    type: 'qualification',
    label: 'Trade qualification',
    icon: Award,
    expires: false,
    required: true,
    hint: 'City & Guilds, IMI or equivalent',
  },
  { type: 'vat', label: 'VAT registration', icon: Receipt, expires: false, required: false, hint: 'Only if you are VAT registered' },
];

export function docTypeDef(type: string): DocTypeDef {
  return DOC_TYPES.find((def) => def.type === type) ?? { ...DOC_TYPES[3]!, type: type as DocType, label: type };
}

/** The CRM's `status` CHECK — `pending_review`, not "pending"; `verified`, not "approved". */
export const DOC_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending_review: { label: 'In review', tone: 'pending' },
  verified: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'error' },
  expired: { label: 'Expired', tone: 'error' },
};

/** The CRM's `EXPIRY_WARN_DAYS`. */
export const EXPIRY_WARN_DAYS = 30;

export type ExpiryState = 'ok' | 'expiring_soon' | 'expired' | 'none';

/** Whole days from today (London) to a `date` column; negative once past. */
export function daysUntil(expiresAt: string | null, now = new Date()): number | null {
  if (!expiresAt) return null;
  const expiry = dayInstant(expiresAt);
  const today = dayInstant(londonDayKey(now));
  if (!expiry || !today) return null;
  return Math.round((expiry.getTime() - today.getTime()) / 86_400_000);
}

export function expiryState(expiresAt: string | null, now = new Date()): ExpiryState {
  const days = daysUntil(expiresAt, now);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= EXPIRY_WARN_DAYS) return 'expiring_soon';
  return 'ok';
}

/** The CRM's caps, mirrored so the picker can refuse before uploading. */
/** The CRM's private bucket for documents — written only on a token it signs. */
const DOCS_BUCKET = 'mechanic-docs';

/**
 * Mirrors the CRM's `MAX_DIRECT_DOC_BYTES`: documents go straight to Storage, so
 * the cap is no longer about request size. Photos never get near it — they are
 * shrunk first — so in practice it only meets a very large PDF.
 */
export const MAX_DOC_BYTES = 25 * 1024 * 1024;
export const ACCEPTED_DOC_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;

/** Every document, newest first. The newest row per type is the current one. */
export async function fetchDocuments(): Promise<DocumentRow[] | null> {
  const { data, error } = await supabase
    .from('mechanic_documents')
    .select('id, doc_type, status, expires_at, uploaded_at')
    .order('uploaded_at', { ascending: false });
  return error ? null : data;
}

/** The current row for each type — the newest — keyed by type. */
export function currentByType(rows: readonly DocumentRow[]): Map<string, DocumentRow> {
  const out = new Map<string, DocumentRow>();
  for (const row of rows) if (!out.has(row.doc_type)) out.set(row.doc_type, row);
  return out;
}

/**
 * What the Account tab's Documents row and the page's banner should say: the
 * most urgent problem across the current documents, or nothing.
 */
export function documentsAlert(
  rows: readonly DocumentRow[],
  now = new Date(),
): { label: string; detail: string; tone: 'danger' | 'warn'; badge: string } | null {
  const current = [...currentByType(rows).values()];
  const missing = DOC_TYPES.filter((def) => def.required && !current.some((row) => row.doc_type === def.type));
  const expired = current.filter((row) => row.status === 'expired' || expiryState(row.expires_at, now) === 'expired');
  const rejected = current.filter((row) => row.status === 'rejected');
  const expiring = current
    .map((row) => ({ row, days: daysUntil(row.expires_at, now) }))
    .filter((item): item is { row: DocumentRow; days: number } => item.days !== null && item.days >= 0 && item.days <= EXPIRY_WARN_DAYS)
    .sort((a, b) => a.days - b.days);

  if (expired.length) {
    const def = docTypeDef(expired[0]!.doc_type);
    return {
      label: `${def.label} has expired`,
      detail: 'Upload a fresh copy to keep receiving jobs.',
      tone: 'danger',
      badge: 'Expired',
    };
  }
  if (rejected.length) {
    const def = docTypeDef(rejected[0]!.doc_type);
    return {
      label: `${def.label} was rejected`,
      detail: 'Upload a clearer copy and we will look again.',
      tone: 'danger',
      badge: 'Rejected',
    };
  }
  if (missing.length) {
    const def = missing[0]!;
    const more = missing.length - 1;
    return {
      label: more ? `${def.label} and ${more} more not on file` : `${def.label} not on file`,
      detail:
        'Book My Tech keeps these on file for every mechanic. If you were approved with a ' +
        'deadline for your paperwork, new jobs pause once it passes.',
      tone: 'warn',
      badge: 'Missing',
    };
  }
  if (expiring.length) {
    const { row, days } = expiring[0]!;
    const def = docTypeDef(row.doc_type);
    const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
    return {
      label: `${def.label} expires ${when}`,
      detail: `Upload a fresh certificate to keep dispatching after ${formatExpiry(row.expires_at)}.`,
      tone: 'warn',
      badge: 'Expiring',
    };
  }
  return null;
}

/** "29 Sep" this year, "22 Mar 26" another. */
export function formatExpiry(expiresAt: string | null, now = new Date()): string {
  if (!expiresAt) return 'never';
  const date = dayInstant(expiresAt);
  if (!date) return expiresAt;
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: '2-digit' }),
    timeZone: 'Europe/London',
  });
}

type Failure = { ok: false; error: string };

function failure(status: number | undefined, error: string, retryAfter?: number): Failure {
  return { ok: false, error: status === 429 ? rateLimitMessage(retryAfter) : error };
}

/**
 * One document. The file goes straight to Storage on a token the CRM signs,
 * then the CRM checks what landed and inserts the row as `pending_review`; the
 * id comes back so the list can show it at once. Three calls rather than one
 * multipart POST so a document can be up to 25 MB — see `putToSignedUpload`.
 */
export async function uploadDocument(input: {
  docType: DocType;
  file: PickedFile & { size?: number | null };
  expiresAt?: string | null;
}): Promise<{ ok: true; id: string } | Failure> {
  const mime = input.file.mimeType ?? 'image/jpeg';
  if (!(ACCEPTED_DOC_MIME as readonly string[]).includes(mime)) {
    return { ok: false, error: 'Use a PDF or a JPEG, PNG or WebP image.' };
  }
  if (input.file.size != null && input.file.size > MAX_DOC_BYTES) {
    return { ok: false, error: 'This file is over 25 MB. Try scanning it at a lower quality, or upload a photo of it instead — photos are made smaller automatically.' };
  }

  const signed = await api.post<{ path: string; token: string }>('/mechanic/documents/upload-url', {
    doc_type: input.docType,
    mime,
  });
  if (!signed.ok) return failure(signed.status, signed.error, signed.retryAfter);

  const sent = await putToSignedUpload(
    DOCS_BUCKET,
    signed.data,
    {
      uri: input.file.uri,
      mimeType: mime,
      fileName: input.file.fileName ?? `document.${mime === 'application/pdf' ? 'pdf' : 'jpg'}`,
    },
    { upsert: false },
  );
  if (!sent) {
    return { ok: false, error: "That file didn't upload. Check your connection and try again." };
  }

  const response = await api.post<{ id: string }>('/mechanic/documents/confirm', {
    doc_type: input.docType,
    path: signed.data.path,
    expires_at: input.expiresAt ?? '',
  });
  return response.ok
    ? { ok: true, id: response.data.id }
    : failure(response.status, response.error, response.retryAfter);
}

/** A signed link to view one, good for an hour. */
export async function documentUrl(documentId: string): Promise<{ ok: true; url: string } | Failure> {
  const response = await api.get<{ url: string }>(
    `/mechanic/documents/${encodeURIComponent(documentId)}/url`,
  );
  return response.ok
    ? { ok: true, url: response.data.url }
    : failure(response.status, response.error, response.retryAfter);
}
