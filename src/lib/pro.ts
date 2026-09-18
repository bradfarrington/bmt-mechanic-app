import { api, rateLimitMessage } from '@/lib/api';

/**
 * The Pro tier. Today `mechanics.is_pro` is a badge an admin sets; the path
 * to it, what it gives and what keeps it are the CRM's to define, so the
 * screen prints what `GET /mechanic/pro` says and hard-codes no threshold.
 * See `docs/account-crm-prompt.md` §5.
 */
export interface ProStatus {
  isPro: boolean;
  /** Fractions — 0.15 and 0.12. */
  standardRate: number;
  proRate: number;
  progress: { jobsDone: number; jobsNeeded: number };
  keep: { label: string; met: boolean }[];
  perks: { title: string; detail: string }[];
}

export async function fetchPro(): Promise<
  { ok: true; pro: ProStatus } | { ok: false; error: string; missing: boolean }
> {
  const response = await api.get<ProStatus>('/mechanic/pro');
  if (response.ok) return { ok: true, pro: response.data };
  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
    // The route is the last of the prompt's to land; until it does the screen
    // shows the badge alone rather than an error.
    missing: response.status === 404,
  };
}

/** "15%" from 0.15. */
export function formatRate(rate: number) {
  return `${Math.round(rate * 100)}%`;
}
