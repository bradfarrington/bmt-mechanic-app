import { api, rateLimitMessage } from '@/lib/api';
import { dayInstant, formatLondon, londonDayKey, londonParts, type DayKey } from '@/lib/london-time';
import { supabase } from '@/lib/supabase';

/**
 * What they have earned and what has reached them.
 *
 * The sums are the app's, from its own completed bookings under RLS, exactly
 * as the CRM's web earnings page does them client-side: month to date, the
 * average per job, a run-rate projection and a daily series. What the app
 * cannot see is Stripe — the bank account, the real transfers and the Express
 * dashboard — and that comes through `GET /mechanic/earnings` and
 * `POST /mechanic/stripe/dashboard`. See `docs/account-crm-prompt.md` §1.
 *
 * Mechanics are paid per job on completion (owner decision 2026-07-01), so
 * there is no "next payout" and nothing here pretends there is one.
 */

export interface CompletedJob {
  id: string;
  completedAt: string;
  totalPence: number;
  payoutPence: number;
}

/** The CRM's `mechanicSharePence`: commission on the whole total, parts included. */
export function mechanicSharePence(totalPence: number, commissionRate: number) {
  return totalPence - Math.round(totalPence * commissionRate);
}

/** Completed jobs over the last year, oldest first — enough for every period the chart offers. */
export async function fetchCompletedJobs(now = new Date()): Promise<CompletedJob[] | null> {
  const since = new Date(now.getTime() - 366 * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('bookings')
    .select('id, total_pence, commission_rate, mechanic_payout_pence, completed_at')
    .eq('status', 'completed')
    .gte('completed_at', since)
    .order('completed_at', { ascending: true });
  if (error) return null;

  return data
    .filter((row): row is typeof row & { completed_at: string } => !!row.completed_at)
    .map((row) => ({
      id: row.id,
      completedAt: row.completed_at,
      totalPence: row.total_pence,
      payoutPence: row.mechanic_payout_pence ?? mechanicSharePence(row.total_pence, row.commission_rate ?? 0.15),
    }));
}

export interface MonthSummary {
  earnedPence: number;
  jobs: number;
  avgPence: number | null;
  /** Straight-line run rate to the end of the month. */
  projectedPence: number;
  lastMonthPence: number;
  /** Projected against last month's whole; null when last month was empty. */
  changePercent: number | null;
  /** "Sep", "Aug" */
  monthLabel: string;
  lastMonthLabel: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthSummary(jobs: readonly CompletedJob[], now = new Date()): MonthSummary {
  const today = londonParts(now);
  const lastMonth = today.month === 1 ? { year: today.year - 1, month: 12 } : { year: today.year, month: today.month - 1 };
  const daysInMonth = new Date(Date.UTC(today.year, today.month, 0)).getUTCDate();

  let earnedPence = 0;
  let count = 0;
  let lastMonthPence = 0;
  for (const job of jobs) {
    const at = londonParts(new Date(job.completedAt));
    if (at.year === today.year && at.month === today.month) {
      earnedPence += job.payoutPence;
      count += 1;
    } else if (at.year === lastMonth.year && at.month === lastMonth.month) {
      lastMonthPence += job.payoutPence;
    }
  }

  const projectedPence = Math.round((earnedPence / today.day) * daysInMonth);
  return {
    earnedPence,
    jobs: count,
    avgPence: count ? Math.round(earnedPence / count) : null,
    projectedPence,
    lastMonthPence,
    changePercent: lastMonthPence ? Math.round(((projectedPence - lastMonthPence) / lastMonthPence) * 100) : null,
    monthLabel: MONTHS[today.month - 1]!,
    lastMonthLabel: MONTHS[lastMonth.month - 1]!,
  };
}

export type PeriodKey = '30d' | '7d' | 'year';

export const PERIODS: readonly { key: PeriodKey; label: string; days: number }[] = [
  { key: '30d', label: '30d', days: 30 },
  { key: '7d', label: '7d', days: 7 },
  { key: 'year', label: 'Yr', days: 365 },
];

export interface SeriesPoint {
  day: DayKey;
  pence: number;
}

/** One point per London day for the last `days` days, ending today, zero-filled. */
export function dailySeries(jobs: readonly CompletedJob[], days: number, now = new Date()): SeriesPoint[] {
  const noonToday = dayInstant(londonDayKey(now)) ?? now;
  const points: SeriesPoint[] = [];
  const index = new Map<string, number>();
  for (let back = days - 1; back >= 0; back -= 1) {
    const day = londonDayKey(new Date(noonToday.getTime() - back * 86_400_000));
    index.set(day, points.length);
    points.push({ day, pence: 0 });
  }
  for (const job of jobs) {
    const at = index.get(londonDayKey(new Date(job.completedAt)));
    if (at !== undefined) points[at]!.pence += job.payoutPence;
  }
  return points;
}

/** The three labels under the chart: the first day, the middle one and "Today". */
export function seriesLabels(points: readonly SeriesPoint[]): [string, string, string] {
  const label = (point: SeriesPoint | undefined) => {
    const date = point ? dayInstant(point.day) : null;
    return date ? formatLondon(date, { day: 'numeric', month: 'short' }) : '';
  };
  return [label(points[0]), label(points[Math.floor(points.length / 2)]), 'Today'];
}

/** What `GET /mechanic/earnings` answers with. */
export interface EarningsRemote {
  balance: {
    totalEarnedPence: number;
    totalPaidOutPence: number;
    totalClawedBackPence: number;
    balancePence: number;
  };
  commissionRate: number;
  account: { bankName: string; last4: string } | null;
  payouts: {
    id: string;
    at: string;
    amountPence: number;
    /** Stripe transfers carry no status; `reversed` is the one real distinction. */
    status: 'paid' | 'reversed';
    /** Set only while the booking still exists, so a link to it always opens. */
    bookingId: string | null;
    description: string | null;
  }[];
  /**
   * "The next payout can go": a Connect account to pay into, and Stripe
   * configured. `payouts` comes from the ledger, so it can list earlier
   * payouts — even to a replaced account — while this is false.
   */
  payoutsLive: boolean;
}

export async function fetchEarnings(): Promise<
  { ok: true; earnings: EarningsRemote } | { ok: false; error: string }
> {
  const response = await api.get<EarningsRemote>('/mechanic/earnings');
  if (response.ok) return { ok: true, earnings: response.data };
  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
  };
}

/**
 * The ledger's own totals, read direct — what the CRM's route also answers
 * with, kept here so the balance still shows when Stripe is unreachable.
 */
export async function fetchLedgerBalance(): Promise<EarningsRemote['balance'] | null> {
  const { data, error } = await supabase.from('mechanic_ledger').select('entry_type, amount_pence');
  if (error) return null;

  const balance = { totalEarnedPence: 0, totalPaidOutPence: 0, totalClawedBackPence: 0, balancePence: 0 };
  for (const row of data) {
    balance.balancePence += row.amount_pence;
    if (row.entry_type === 'earning') balance.totalEarnedPence += row.amount_pence;
    else if (row.entry_type === 'payout') balance.totalPaidOutPence += -row.amount_pence;
    else if (row.entry_type === 'refund_clawback') balance.totalClawedBackPence += -row.amount_pence;
  }
  return balance;
}

/** A one-time link to the Stripe Express dashboard, for the in-app browser. */
export async function stripeDashboardUrl(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const response = await api.post<{ url: string }>('/mechanic/stripe/dashboard');
  if (response.ok) return { ok: true, url: response.data.url };
  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
  };
}

/** "£1,240" — whole pounds, the way the earnings screen sets figures. */
export function formatPounds(pence: number) {
  return `£${Math.round(pence / 100).toLocaleString('en-GB')}`;
}

/** "15%" from 0.15. */
export function formatRate(rate: number) {
  return `${Math.round(rate * 100)}%`;
}
