import { api, rateLimitMessage, type ApiResult } from '@/lib/api';
import { supabase } from '@/lib/supabase';

/**
 * Disputes — three-way between customer, mechanic and Book My Tech, one per
 * booking. The thread is read direct (RLS shows both parties their thread, and
 * hides the other side's private BMT notes); the dispute itself and every
 * action go through the CRM.
 *
 * A dispute left unanswered for 48 hours escalates to BMT by itself. It does
 * not refund by itself.
 */
export interface Dispute {
  id: string;
  bookingId: string;
  jobNumber: string;
  service: string;
  status: 'opened' | 'responded' | 'escalated' | 'resolved' | 'withdrawn';
  statusLabel: string;
  openedByRole: 'customer' | 'mechanic';
  isOpener: boolean;
  customerName: string;
  reasonLabel: string;
  description: string;
  photos: string[];
  refundRequestedPence: number | null;
  /** When BMT steps in if it is still unresolved; null once escalated or closed. */
  escalatesAt: string | null;
  resolutionLabel: string | null;
  resolutionNote: string | null;
  resolutionRefundPence: number | null;
  /** What the outcome means for the mechanic's money, in the CRM's words. */
  payoutLine: string | null;
  can: {
    reply: boolean;
    escalate: boolean;
    withdraw: boolean;
    acceptRefund: boolean;
    offerRedo: boolean;
  };
  /** The reasons a mechanic may raise — the vocabulary is role-scoped. */
  mechanicReasons: { value: string; label: string }[];
}

export interface DisputeMessage {
  id: string;
  sender_role: 'customer' | 'mechanic' | 'admin';
  body: string;
  created_at: string;
  photos: string[];
  /** Set on a BMT note only one party can see. */
  visible_to: 'mechanic' | 'customer' | null;
}

type Failure = { ok: false; error: string };

function failure(response: Extract<ApiResult<unknown>, { ok: false }>): Failure {
  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
  };
}

const at = (disputeId: string, rest = '') =>
  `/mechanic/disputes/${encodeURIComponent(disputeId)}${rest}`;

export async function fetchDispute(
  disputeId: string,
): Promise<{ ok: true; dispute: Dispute } | Failure> {
  const response = await api.get<Dispute>(at(disputeId));
  return response.ok ? { ok: true, dispute: response.data } : failure(response);
}

export async function fetchDisputeThread(disputeId: string): Promise<DisputeMessage[]> {
  const { data } = await supabase
    .from('dispute_messages')
    .select('*')
    .eq('dispute_id', disputeId)
    .order('created_at', { ascending: true });

  // `photos` and `visible_to` arrive with the CRM's inbox migration; until the
  // generated types have them, read them defensively.
  return (data ?? []).map((row) => {
    const extra = row as { photos?: string[] | null; visible_to?: DisputeMessage['visible_to'] };
    return {
      id: row.id,
      sender_role: row.sender_role as DisputeMessage['sender_role'],
      body: row.body,
      created_at: row.created_at,
      photos: extra.photos ?? [],
      visible_to: extra.visible_to ?? null,
    };
  });
}

/** The dispute on a booking, if there is one — a booking can only ever have one. */
export async function disputeIdForBooking(bookingId: string): Promise<string | null> {
  const { data } = await supabase
    .from('disputes')
    .select('id')
    .eq('booking_id', bookingId)
    .maybeSingle();
  return data?.id ?? null;
}

async function act<T = object>(url: string, body?: unknown): Promise<({ ok: true } & T) | Failure> {
  const response = await api.post<T>(url, body);
  return response.ok ? { ok: true, ...response.data } : failure(response);
}

/** Only on a job that is en route, in progress or completed. */
export const openDispute = (
  bookingId: string,
  input: { reasonCategory: string; description: string; photos?: string[] },
) =>
  act<{ disputeId: string }>(
    `/mechanic/bookings/${encodeURIComponent(bookingId)}/disputes`,
    input,
  );

export const sendDisputeMessage = (disputeId: string, body: string, photos: string[] = []) =>
  act<{ id: string }>(at(disputeId, '/messages'), { body, ...(photos.length ? { photos } : {}) });

/** Ask Book My Tech to step in and decide. */
export const escalateDispute = (disputeId: string) => act(at(disputeId, '/escalate'));

/** Only whoever opened it can withdraw it. A withdrawn dispute cannot be reopened. */
export const withdrawDispute = (disputeId: string) => act(at(disputeId, '/withdraw'));

/** Settles it: the customer is refunded and the amount comes off the mechanic's next payout. */
export const acceptRefund = (disputeId: string) =>
  act<{ refundPence: number }>(at(disputeId, '/accept-refund'));

/** Offer to come back and put it right. Once per dispute. */
export const offerRedo = (disputeId: string, note?: string) =>
  act<{ id: string }>(at(disputeId, '/offer-redo'), note?.trim() ? { note: note.trim() } : {});

/** "47h", "35 min" — how long until BMT steps in. Null once that has passed. */
export function timeLeft(escalatesAt: string | null, now: number) {
  if (!escalatesAt) return null;
  const minutes = Math.floor((new Date(escalatesAt).getTime() - now) / 60_000);
  if (minutes <= 0) return null;
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h` : `${minutes} min`;
}
