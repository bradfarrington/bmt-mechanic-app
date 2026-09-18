import { api, rateLimitMessage, type ApiResult } from '@/lib/api';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

/**
 * Get help — a case between the mechanic and Book My Tech about one of their
 * jobs. Never visible to the customer, and nothing to do with money: that is a
 * dispute. Reads are direct under RLS; opening, replying and closing go
 * through the CRM.
 */
type Tables = Database['public']['Tables'];

export type CaseReason = Pick<Tables['resolution_reasons']['Row'], 'id' | 'label'>;

export type HelpCase = Pick<
  Tables['resolution_cases']['Row'],
  'id' | 'booking_id' | 'reason_label' | 'description' | 'status' | 'resolution_note' | 'created_at' | 'photos'
>;

export type CaseMessage = Pick<Tables['resolution_messages']['Row'], 'id' | 'body' | 'created_at'> & {
  /** Only the two parties to a case ever write in it. */
  sender_role: 'mechanic' | 'admin';
};

export const CASE_STATUS: Record<string, { label: string; tone: 'active' | 'pending' | 'success' | 'neutral' }> = {
  open: { label: 'Open', tone: 'active' },
  in_progress: { label: 'In progress', tone: 'pending' },
  resolved: { label: 'Resolved', tone: 'success' },
  closed: { label: 'Closed', tone: 'neutral' },
};

/** The CRM's bounds on a case's description. */
export const MIN_CASE_CHARS = 20;
export const MAX_CASE_CHARS = 2000;

/** The reasons are rows BMT edits, not a fixed list. */
export async function fetchCaseReasons(): Promise<CaseReason[]> {
  const { data } = await supabase
    .from('resolution_reasons')
    .select('id, label')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  return data ?? [];
}

const CASE_COLUMNS =
  'id, booking_id, reason_label, description, status, resolution_note, created_at, photos';

export async function fetchCases(): Promise<HelpCase[]> {
  const { data } = await supabase
    .from('resolution_cases')
    .select(CASE_COLUMNS)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function fetchCase(
  caseId: string,
): Promise<{ helpCase: HelpCase; messages: CaseMessage[] } | null> {
  const [found, thread] = await Promise.all([
    supabase.from('resolution_cases').select(CASE_COLUMNS).eq('id', caseId).maybeSingle(),
    supabase
      .from('resolution_messages')
      .select('id, sender_role, body, created_at')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true }),
  ]);

  return found.data
    ? {
        helpCase: found.data,
        messages: (thread.data ?? []).map((row) => ({
          ...row,
          sender_role: row.sender_role as CaseMessage['sender_role'],
        })),
      }
    : null;
}

type Failure = { ok: false; error: string };

function failure(response: Extract<ApiResult<unknown>, { ok: false }>): Failure {
  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
  };
}

export async function openCase(input: {
  bookingId: string;
  reasonId: string;
  description: string;
  photos?: string[];
}): Promise<{ ok: true; caseId: string } | Failure> {
  const response = await api.post<{ caseId: string }>('/mechanic/cases', input);
  return response.ok ? { ok: true, caseId: response.data.caseId } : failure(response);
}

export async function postCaseMessage(caseId: string, body: string): Promise<{ ok: true } | Failure> {
  const response = await api.post(`/mechanic/cases/${encodeURIComponent(caseId)}/messages`, { body });
  return response.ok ? { ok: true } : failure(response);
}

/** A mechanic can close their own case; only BMT can resolve one. */
export async function closeCase(caseId: string): Promise<{ ok: true } | Failure> {
  const response = await api.post(`/mechanic/cases/${encodeURIComponent(caseId)}/close`);
  return response.ok ? { ok: true } : failure(response);
}
