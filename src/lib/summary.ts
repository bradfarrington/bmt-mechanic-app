import { api, rateLimitMessage } from '@/lib/api';
import type { DayKey } from '@/lib/london-time';

/**
 * What the app cannot work out for itself about a day: distances (the CRM
 * geocodes; the app never sees coordinates), when to set off, the accept rate
 * and the day's totals. The jobs themselves are read direct — see `lib/jobs`.
 */
export interface DaySummary {
  dayKey: string;
  jobs: { bookingId: string; distanceMiles: number | null }[];
  /** When to set off for the day's first open job, and its postcode district. */
  leaveBy: { iso: string; area: string | null } | null;
  /** Accepted ÷ answered over `windowDays`. `percent` is null with nothing answered. */
  acceptRate: { percent: number | null; accepted: number; answered: number; windowDays: number };
  totals: {
    earnedPence: number;
    bookedPence: number;
    completedJobs: number;
    workedMinutes: number;
    distanceMiles: number | null;
  };
}

export async function fetchSummary(
  day?: DayKey | string,
): Promise<{ ok: true; summary: DaySummary } | { ok: false; error: string }> {
  const query = day ? `?day=${encodeURIComponent(day)}` : '';
  const response = await api.get<DaySummary>(`/mechanic/summary${query}`);
  if (response.ok) return { ok: true, summary: response.data };

  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
  };
}

export function distanceFor(summary: DaySummary | null, bookingId: string) {
  const miles = summary?.jobs.find((job) => job.bookingId === bookingId)?.distanceMiles;
  return miles == null ? null : `${miles.toFixed(1)} mi`;
}

/** "6h 45m" */
export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return [hours ? `${hours}h` : null, rest || !hours ? `${rest}m` : null].filter(Boolean).join(' ');
}
