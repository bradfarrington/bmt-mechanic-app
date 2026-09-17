import { api, rateLimitMessage, type ApiResult } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

/**
 * One job, as the mechanic working it sees it.
 *
 * **Reads** come straight from Supabase — RLS shows an assigned mechanic the
 * whole booking and everything hanging off it. **Writes** all go through the
 * CRM (`/mechanic/bookings/:id/*`): each one emails, texts or pushes the
 * customer, records a `booking_events` row, and one of them moves money.
 */
type Tables = Database['public']['Tables'];

export type JobBooking = Pick<
  Tables['bookings']['Row'],
  | 'id'
  | 'job_number'
  | 'status'
  | 'mechanic_id'
  | 'scheduled_at'
  | 'slot_window'
  | 'candidate_days'
  | 'total_pence'
  | 'mechanic_payout_pence'
  | 'vehicle_reg'
  | 'vehicle_make'
  | 'vehicle_model'
  | 'postcode'
  | 'area'
  | 'address_line_1'
  | 'address_line_2'
  | 'customer_name'
  | 'customer_phone'
  | 'special_instructions'
  | 'cancellation_reason'
  | 'reschedule_status'
  | 'reschedule_proposed_at'
  | 'repair_description'
  | 'service_duration_hours'
  | 'mileage'
  | 'en_route_at'
  | 'started_at'
  | 'completed_at'
>;

const BOOKING_COLUMNS =
  'id, job_number, status, mechanic_id, scheduled_at, slot_window, candidate_days, total_pence, ' +
  'mechanic_payout_pence, vehicle_reg, vehicle_make, vehicle_model, postcode, area, ' +
  'address_line_1, address_line_2, customer_name, customer_phone, special_instructions, ' +
  'cancellation_reason, reschedule_status, reschedule_proposed_at, repair_description, ' +
  'service_duration_hours, mileage, en_route_at, started_at, completed_at';

export interface JobPhoto {
  id: string;
  url: string;
}

export type JobPart = Pick<
  Tables['booking_parts']['Row'],
  'id' | 'part_name' | 'quantity' | 'total_pence' | 'sourcing' | 'status'
>;

export type JobQuote = Pick<
  Tables['job_quotes']['Row'],
  'id' | 'kind' | 'status' | 'title' | 'total_pence' | 'mechanic_payout_pence' | 'sent_at'
>;

/** Something the mechanic noticed on the car — a note for the customer, and the seed of a quote. */
export type JobFault = Pick<
  Tables['booking_faults']['Row'],
  'id' | 'description' | 'severity' | 'quote_id' | 'created_at'
>;

export interface JobRecord {
  booking: JobBooking;
  photos: JobPhoto[];
  parts: JobPart[];
  quotes: JobQuote[];
  faults: JobFault[];
}

/** The photos bucket is public; its keys are unguessable booking UUIDs. */
const MEDIA_BUCKET = 'job-media';

export async function loadJob(
  bookingId: string,
): Promise<{ ok: true; job: JobRecord } | { ok: false; error: string; missing?: boolean }> {
  const [booking, media, parts, quotes, faults] = await Promise.all([
    supabase
      .from('bookings')
      .select(BOOKING_COLUMNS)
      .eq('id', bookingId)
      .maybeSingle()
      .returns<JobBooking | null>(),
    supabase
      .from('booking_media')
      .select('id, kind, storage_path, created_at')
      .eq('booking_id', bookingId)
      .eq('kind', 'photo')
      .order('created_at', { ascending: true }),
    supabase
      .from('booking_parts')
      .select('id, part_name, quantity, total_pence, sourcing, status')
      .eq('booking_id', bookingId),
    supabase
      .from('job_quotes')
      .select('id, kind, status, title, total_pence, mechanic_payout_pence, sent_at')
      .eq('booking_id', bookingId)
      .order('sent_at', { ascending: false }),
    supabase
      .from('booking_faults')
      .select('id, description, severity, quote_id, created_at')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true }),
  ]);

  if (booking.error) {
    return { ok: false, error: "Couldn't load this job. Pull down to try again." };
  }
  // No row under RLS: it was never theirs, or it has been reassigned.
  if (!booking.data) {
    return { ok: false, missing: true, error: 'This job is no longer assigned to you.' };
  }

  return {
    ok: true,
    job: {
      booking: booking.data,
      photos: (media.data ?? []).map((row) => ({
        id: row.id,
        url: supabase.storage.from(MEDIA_BUCKET).getPublicUrl(row.storage_path).data.publicUrl,
      })),
      parts: parts.data ?? [],
      quotes: quotes.data ?? [],
      faults: faults.data ?? [],
    },
  };
}

export type ChecklistKind = 'service' | 'inspection';

export interface ChecklistItem {
  id: string;
  label: string;
  result: string | null;
  comment: string | null;
}

export interface ChecklistProgress {
  answered: number;
  total: number;
  advisories: number;
  fails: number;
}

export interface Checklist {
  key: string;
  name: string;
  kind: ChecklistKind;
  tier: string | null;
  /** The answers this kind takes, in display order. */
  answers: string[];
  sections: { name: string; items: ChecklistItem[] }[];
  progress: ChecklistProgress;
}

/** What only the CRM can work out: coordinates, the money, the checklists. */
export interface JobExtras {
  destination: { lat: number; lng: number } | null;
  distanceMiles: number | null;
  money: {
    customerPaysPence: number;
    /** What Complete captures — the total less credit and discount. */
    chargePence: number;
    bmtPartsPence: number;
    platformFeePence: number;
    commissionRate: number;
    payoutPence: number;
  };
  checklists: Checklist[];
  /** Why Complete would be refused right now, in the CRM's words; null when it would go through. */
  completeBlocker: string | null;
  cancelReasons: string[];
}

export type JobFailure = { ok: false; error: string };

function failure(response: Extract<ApiResult<unknown>, { ok: false }>): JobFailure {
  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
  };
}

const path = (bookingId: string, rest: string) =>
  `/mechanic/bookings/${encodeURIComponent(bookingId)}/${rest}`;

export async function fetchJobExtras(
  bookingId: string,
): Promise<{ ok: true; extras: JobExtras } | JobFailure> {
  const response = await api.get<JobExtras>(path(bookingId, 'job'));
  return response.ok ? { ok: true, extras: response.data } : failure(response);
}

async function act<T = object>(
  url: string,
  body?: unknown,
): Promise<({ ok: true } & T) | JobFailure> {
  const response = await api.post<T>(url, body);
  return response.ok ? { ok: true, ...response.data } : failure(response);
}

/** `confirmed → en_route`. The customer is emailed, texted and pushed. */
export const startJourney = (bookingId: string) => act(path(bookingId, 'start-journey'));

/** `en_route → in_progress`. */
export const beginWork = (bookingId: string) => act(path(bookingId, 'begin-work'));

/**
 * `in_progress → completed`, capturing the customer's pre-authorised payment.
 * A failed capture leaves the job in progress, and the call is safe to retry.
 */
export const completeJob = (bookingId: string) =>
  act<{ chargedPence: number; payoutPence: number }>(path(bookingId, 'complete'));

export const setMileage = (bookingId: string, mileage: number) =>
  act(path(bookingId, 'mileage'), { mileage });

/** Hands the job back for re-dispatch. Only a `confirmed` job can be cancelled. */
export const cancelJob = (bookingId: string, reason: string, detail?: string) =>
  act(path(bookingId, 'cancel'), { reason, ...(detail?.trim() ? { detail: detail.trim() } : {}) });

/** The booking keeps its slot until the customer answers. */
export const proposeReschedule = (bookingId: string, newIso: string, note: string) =>
  act(path(bookingId, 'reschedule'), { newIso, note });

export const saveChecklistAnswer = (
  bookingId: string,
  input: { itemId: string; result?: string; comment?: string | null },
) =>
  act<{ progress: ChecklistProgress; completeBlocker: string | null }>(
    path(bookingId, 'checklist'),
    input,
  );

/** A part's journey: ordered, delivered, then used on the car. */
export type PartStatus = 'ordered' | 'delivered' | 'used';

export const setPartStatus = (partId: string, status: PartStatus) =>
  act(`/mechanic/booking-parts/${encodeURIComponent(partId)}/status`, { status });

export const addFault = (
  bookingId: string,
  input: { description: string; severity: 'advisory' | 'urgent' },
) => act<{ id: string }>(path(bookingId, 'faults'), input);

/** Refused while the fault has a quote against it — withdraw the quote first. */
export const removeFault = (faultId: string) =>
  act(`/mechanic/faults/${encodeURIComponent(faultId)}/remove`);

export const setPartSourcing = (partId: string, sourcing: 'self' | 'bmt') =>
  act<{ payoutPence: number }>(
    `/mechanic/booking-parts/${encodeURIComponent(partId)}/sourcing`,
    { sourcing },
  );

/** One photo per call, as multipart — the bucket takes no direct writes. */
export async function uploadPhoto(
  bookingId: string,
  file: { uri: string; mimeType?: string | null; fileName?: string | null },
): Promise<({ ok: true } & JobPhoto) | JobFailure> {
  const form = new FormData();
  // React Native's FormData takes a file as this object, not a Blob.
  form.append('file', {
    uri: file.uri,
    type: file.mimeType ?? 'image/jpeg',
    name: file.fileName ?? 'photo.jpg',
  } as unknown as Blob);

  const response = await api.upload<JobPhoto>(path(bookingId, 'photos'), form);
  return response.ok ? { ok: true, ...response.data } : failure(response);
}

export const removePhoto = (mediaId: string) =>
  act(`/mechanic/photos/${encodeURIComponent(mediaId)}/remove`);

export interface QuoteLineInput {
  kind: 'labour' | 'part' | 'other';
  description: string;
  /** Labour only. The rate is the platform's, never the mechanic's. */
  hours?: number;
  /** Parts and other. */
  quantity?: number;
  unitPence?: number;
  /** The fault this line answers, so the fault shows as quoted. */
  faultId?: string;
}

export interface QuotePreview {
  lines: { linePence: number }[];
  totalPence: number;
  platformFeePence: number;
  mechanicPayoutPence: number;
  hourlyRatePence: number;
}

/** Prices a draft without saving it — the CRM owns the pricing rules. */
export async function previewQuote(
  bookingId: string,
  lines: QuoteLineInput[],
): Promise<{ ok: true; preview: QuotePreview } | JobFailure> {
  const response = await api.post<QuotePreview>(path(bookingId, 'quotes/preview'), { lines });
  return response.ok ? { ok: true, preview: response.data } : failure(response);
}

export const sendQuote = (
  bookingId: string,
  input: { kind: 'now' | 'follow_on'; title?: string; note?: string; lines: QuoteLineInput[] },
) => act<{ id: string }>(path(bookingId, 'quotes'), input);

export const withdrawQuote = (quoteId: string) =>
  act(`/mechanic/quotes/${encodeURIComponent(quoteId)}/withdraw`);

/** A repair on the job, as the revision panel lists it. `id` is what a revision's `repairIds` takes. */
export interface RevisionRepair {
  id: string;
  description: string;
  linePence: number;
}

export interface RevisionPartView {
  /** `booking_parts.id` for a part already on the job. */
  id: string;
  name: string;
  quantity: number;
  unitPence: number;
  linePence: number;
  sourcing: 'self' | 'bmt';
}

export interface RevisionSummary {
  id: string;
  status: 'sent' | 'approved' | 'declined' | 'withdrawn' | 'expired';
  statusLabel: string;
  reason: string;
  note: string | null;
  /** One line, ready to print — "Removed Front discs · added Rear pads". */
  summary: string;
  differencePence: number;
  sentAt: string | null;
  expiresAt: string | null;
  respondedAt: string | null;
}

export interface OnSiteOption {
  kind: 'diagnostic' | 'cancellation' | 'none';
  label: string;
  hint: string;
  pence: number;
}

export interface RevisionState {
  current: {
    repairs: RevisionRepair[];
    parts: RevisionPartView[];
    totalPence: number;
    mechanicPayoutPence: number;
  };
  revisions: RevisionSummary[];
  canRevise: boolean;
  /** Why a revision cannot be sent right now, in the CRM's words. */
  reviseBlocker: string | null;
  /** Present only once the customer has declined a revision. */
  onSiteOptions?: OnSiteOption[] | null;
}

/** A part as a revision sends it: one already on the job (by id), or a new one, typed. */
export interface RevisionPartInput {
  id?: string | null;
  name?: string | null;
  quantity?: number | null;
  unitPence?: number | null;
}

export interface RevisionDraft {
  repairIds: string[];
  parts: RevisionPartInput[];
}

export interface RevisionPreview {
  before: { totalPence: number; mechanicPayoutPence: number; serviceDurationHours: number };
  after: { totalPence: number; mechanicPayoutPence: number; serviceDurationHours: number };
  diff: {
    differencePence: number;
    direction: string;
    durationChange: number;
    lines: Record<'added' | 'removed' | 'kept', { description: string; linePence: number }[]>;
    parts: Record<'added' | 'removed' | 'kept', { name: string; quantity: number; linePence: number }[]>;
  };
}

export interface CatalogueHit {
  id: string;
  description: string;
  billedHours: number | null;
  pricePence: number | null;
  bundleName?: string;
  optionLabel?: string | null;
  fixedPrice?: boolean;
}

export async function fetchRevisionState(
  bookingId: string,
): Promise<{ ok: true; state: RevisionState } | JobFailure> {
  const response = await api.get<RevisionState>(path(bookingId, 'revision'));
  return response.ok ? { ok: true, state: response.data } : failure(response);
}

/** Anything bookable for this job's car. The CRM wants at least three characters. */
export async function searchCatalogue(
  bookingId: string,
  query: string,
): Promise<{ ok: true; hits: CatalogueHit[]; truncated: boolean } | JobFailure> {
  const response = await api.get<{ hits: CatalogueHit[]; truncated: boolean }>(
    path(bookingId, `catalogue?query=${encodeURIComponent(query)}`),
  );
  return response.ok ? { ok: true, ...response.data } : failure(response);
}

/** Prices a changed job without sending it. A draft the CRM cannot price yet is an ordinary refusal. */
export async function previewRevision(
  bookingId: string,
  draft: RevisionDraft,
): Promise<{ ok: true; preview: RevisionPreview } | JobFailure> {
  const response = await api.post<RevisionPreview>(path(bookingId, 'revision/preview'), draft);
  return response.ok ? { ok: true, preview: response.data } : failure(response);
}

/** The customer reads `reason` before approving; they have 24 hours. */
export const sendRevision = (
  bookingId: string,
  input: RevisionDraft & { reason: string; note?: string },
) => act<{ id: string }>(path(bookingId, 'revision'), input);

export const withdrawRevision = (revisionId: string) =>
  act(`/mechanic/revisions/${encodeURIComponent(revisionId)}/withdraw`);

/** Only once the customer has declined a revision. Ends the job, charging the fee chosen — or nothing. */
export const endJobOnSite = (
  bookingId: string,
  input: { charge: OnSiteOption['kind']; note?: string },
) =>
  act<{ status: string; chargedPence: number; payoutPence: number }>(
    path(bookingId, 'end-on-site'),
    input,
  );

/** Running late: propose new times for several jobs at once. Each succeeds or fails by itself. */
export async function proposeReschedules(
  items: { bookingId: string; newIso: string }[],
  note: string,
): Promise<
  { ok: true; proposed: number; failed: { bookingId: string; error: string }[] } | JobFailure
> {
  const response = await api.post<{
    proposed: number;
    failed: { bookingId: string; error: string }[];
  }>('/mechanic/reschedules', { items, note });
  return response.ok
    ? { ok: true, proposed: response.data.proposed, failed: response.data.failed ?? [] }
    : failure(response);
}

/** "BMT-00042" */
export function jobReference(jobNumber: number | null) {
  return jobNumber == null ? 'Job' : `BMT-${String(Math.trunc(jobNumber)).padStart(5, '0')}`;
}

export function jobAddress(booking: Pick<JobBooking, 'address_line_1' | 'address_line_2' | 'postcode'>) {
  return [booking.address_line_1, booking.address_line_2, booking.postcode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

/**
 * The CRM stores the customer's number on the booking and RLS does not hide
 * it, so the app holds the line the web page does: it is for the journey and
 * the job, not for before or after.
 */
export function phoneRevealed(status: string) {
  return status === 'en_route' || status === 'in_progress';
}

export function initials(name: string | null) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1]![0] : '')).toUpperCase() || '?';
}
