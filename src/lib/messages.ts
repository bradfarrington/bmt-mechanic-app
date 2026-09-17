import { api, rateLimitMessage } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

/**
 * The booking message thread between mechanic and customer.
 *
 * Reads come from `public.messages` under "Mechanics read assigned booking
 * messages". Sending and marking-read go through the CRM, which stamps
 * `sender_role` itself, pushes the customer and falls back to SMS — there is
 * no INSERT policy, deliberately.
 *
 * `messages` is deliberately **not** in the realtime publication (the CRM's
 * own thread polls), so the screen polls too.
 */
export type Message = Database['public']['Tables']['messages']['Row'];

/** The CRM caps a message at 2000 characters. */
export const MAX_MESSAGE_CHARS = 2000;

/** A finished booking's thread can be read but not added to. */
export const CLOSED_STATUSES = ['completed', 'cancelled'];

/** One tap to say the things a mechanic says from the van. Sent as ordinary messages. */
export const CANNED_REPLIES = [
  'I’m 10 minutes away',
  'Running 15 min late',
  'Pulling into your street',
  'I’ve arrived',
  'All done — thanks!',
] as const;

export async function fetchMessages(bookingId: string): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('id, booking_id, sender_id, sender_role, body, read_at, created_at, sms_notified_at')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  return data ?? [];
}

export type SimpleResult = { ok: true } | { ok: false; error: string };

export async function sendMessage(bookingId: string, body: string): Promise<SimpleResult> {
  const response = await api.post(
    `/mechanic/bookings/${encodeURIComponent(bookingId)}/messages`,
    { body },
  );
  if (response.ok) return { ok: true };
  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
  };
}

/** Best effort — an unread badge that lingers is not worth an error on screen. */
export async function markMessagesRead(bookingId: string) {
  await api.post(`/mechanic/bookings/${encodeURIComponent(bookingId)}/messages/read`);
}
