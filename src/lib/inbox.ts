import { api, rateLimitMessage, type ApiResult } from '@/lib/api';

/**
 * The inbox feed. Assembled by the CRM from seven sources — message threads,
 * job events, disputes, Get-help cases, payouts, reviews and expiring
 * documents — with the wording kept beside the customer's. The app draws it
 * and follows `link`.
 */
export type InboxTab = 'messages' | 'alerts' | 'bmt';

export type InboxLink =
  | { type: 'thread' | 'job' | 'dispute' | 'case'; id: string }
  | { type: 'earnings' | 'reviews' | 'documents' };

export interface InboxItem {
  /** Stable; the prefix names the source — `thread:`, `event:`, `dispute:` … */
  id: string;
  tab: InboxTab;
  title: string;
  detail: string | null;
  /** "Job 04210 · Ford Focus", or a dispute's escalation clock. */
  reference: string | null;
  at: string;
  unread: boolean;
  tone: 'info' | 'danger' | 'success' | 'warning' | 'neutral';
  icon:
    | 'message'
    | 'dispute'
    | 'case'
    | 'payout'
    | 'review'
    | 'document'
    | 'calendar'
    | 'quote'
    | 'job'
    | 'cancelled';
  /** A red dot rather than a blue one. */
  urgent: boolean;
  /** Set for a person: the row shows their initials instead of an icon. */
  avatarName?: string | null;
  link: InboxLink;
}

export interface Inbox {
  unreadCount: number;
  items: InboxItem[];
}

type Failure = { ok: false; error: string };

function failure(response: Extract<ApiResult<unknown>, { ok: false }>): Failure {
  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
  };
}

export async function fetchInbox(): Promise<{ ok: true; inbox: Inbox } | Failure> {
  const response = await api.get<Inbox>('/mechanic/inbox');
  return response.ok
    ? { ok: true, inbox: { unreadCount: response.data.unreadCount ?? 0, items: response.data.items ?? [] } }
    : failure(response);
}

/**
 * A thread is read by opening it (`messages.read_at`), not here — the CRM
 * ignores `thread:` ids, so the screen does not send them.
 */
export async function markInboxRead(id: string): Promise<{ ok: true; unreadCount: number } | Failure> {
  const response = await api.post<{ unreadCount: number }>('/mechanic/inbox/read', { id });
  return response.ok ? { ok: true, unreadCount: response.data.unreadCount } : failure(response);
}

/** Threads with unread messages still count afterwards. */
export async function markInboxAllRead(): Promise<{ ok: true; unreadCount: number } | Failure> {
  const response = await api.post<{ unreadCount: number }>('/mechanic/inbox/read-all');
  return response.ok ? { ok: true, unreadCount: response.data.unreadCount } : failure(response);
}
