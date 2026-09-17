import { api, rateLimitMessage, type ApiResult } from '@/lib/api';
import { supabase } from '@/lib/supabase';

/**
 * The mechanic's own settings. Service area, specialisms and working hours are
 * written straight to Supabase — RLS lets a mechanic update their own
 * `mechanics` row and manage their own `mechanic_availability` rows, and the
 * CRM's web actions do exactly the same under the mechanic's session. The
 * validation below mirrors `app/actions/mechanic-profile.ts` in the CRM.
 *
 * Payouts and going online are different: they need Stripe's secret key and
 * the dispatcher, so they go through the CRM's mobile API.
 */

/** First-run setup: password, payouts, service area, hours, specialisms. */
export const SETUP_STEPS = 5;

export type ActionResult = { ok: true } | { ok: false; error: string };

const FAILED = "Couldn't save that. Check your connection and try again.";

/** The CRM's bounds. The schema allows 1–100; the web action floors it at 2. */
export const RADIUS_MIN = 2;
export const RADIUS_MAX = 100;

export async function updateServiceArea(
  mechanicId: string,
  input: { radiusMiles: number; basePostcode?: string },
): Promise<ActionResult> {
  const radius = Math.round(input.radiusMiles);
  if (!Number.isFinite(radius) || radius < RADIUS_MIN || radius > RADIUS_MAX) {
    return { ok: false, error: `Pick a radius between ${RADIUS_MIN} and ${RADIUS_MAX} miles.` };
  }

  const postcode = input.basePostcode?.trim().toUpperCase();
  const { error } = await supabase
    .from('mechanics')
    .update({
      service_radius_miles: radius,
      ...(postcode ? { base_postcode: postcode } : {}),
    })
    .eq('id', mechanicId);

  return error ? { ok: false, error: FAILED } : { ok: true };
}

export async function updateSpecialisms(
  mechanicId: string,
  slugs: readonly string[],
): Promise<ActionResult> {
  const clean = Array.from(new Set(slugs.map((slug) => slug.trim()).filter(Boolean)));
  const { error } = await supabase
    .from('mechanics')
    .update({ specialisms: clean })
    .eq('id', mechanicId);

  return error ? { ok: false, error: FAILED } : { ok: true };
}

export interface WorkingDay {
  /** 0 = Sunday, as JS `getDay()` and the `mechanic_availability` table. */
  dayOfWeek: number;
  isActive: boolean;
  /** `HH:MM` */
  startTime: string;
  endTime: string;
}

/** Monday first, the way the week is shown. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** The CRM's default for a day with no row: weekdays on, 08:00–18:00. */
function defaultDay(dayOfWeek: number): WorkingDay {
  return {
    dayOfWeek,
    isActive: dayOfWeek >= 1 && dayOfWeek <= 5,
    startTime: '08:00',
    endTime: '18:00',
  };
}

/**
 * The week, Monday first. `configured` is false when the mechanic has never
 * saved their hours — which is how the app knows first-run setup is still to do.
 */
export async function loadWorkingWeek(
  mechanicId: string,
): Promise<{ ok: true; days: WorkingDay[]; configured: boolean } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('mechanic_availability')
    .select('day_of_week, is_active, start_time, end_time')
    .eq('mechanic_id', mechanicId);

  if (error) return { ok: false, error: "Couldn't load your hours. Pull down to try again." };

  const days = WEEK_ORDER.map((dayOfWeek) => {
    const row = data.find((candidate) => candidate.day_of_week === dayOfWeek);
    if (!row) return defaultDay(dayOfWeek);
    const fallback = defaultDay(dayOfWeek);
    return {
      dayOfWeek,
      isActive: row.is_active,
      // Postgres `time` arrives as `HH:MM:SS`.
      startTime: row.start_time?.slice(0, 5) ?? fallback.startTime,
      endTime: row.end_time?.slice(0, 5) ?? fallback.endTime,
    };
  });

  return { ok: true, days, configured: data.length > 0 };
}

export async function updateWorkingWeek(
  mechanicId: string,
  days: readonly WorkingDay[],
): Promise<ActionResult> {
  for (const day of days) {
    if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
      return { ok: false, error: 'Invalid day in the schedule.' };
    }
    if (day.isActive && day.startTime >= day.endTime) {
      return { ok: false, error: "Each day's end time must be after its start time." };
    }
  }

  const { error } = await supabase.from('mechanic_availability').upsert(
    days.map((day) => ({
      mechanic_id: mechanicId,
      day_of_week: day.dayOfWeek,
      is_active: day.isActive,
      start_time: day.isActive ? day.startTime : null,
      end_time: day.isActive ? day.endTime : null,
    })),
    { onConflict: 'mechanic_id,day_of_week' },
  );

  return error ? { ok: false, error: FAILED } : { ok: true };
}

function failure(response: Extract<ApiResult<unknown>, { ok: false }>) {
  return response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error;
}

/**
 * A Stripe Connect onboarding link. The CRM creates the Express account on
 * first call. Stripe only accepts https return URLs, so the CRM hands Stripe a
 * page of its own that bounces to `returnUrl` — the app's scheme.
 */
export async function startStripeOnboarding(
  returnUrl: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const response = await api.post<{ url: string }>('/mechanic/stripe/onboarding', {
    returnUrl,
  });
  return response.ok
    ? { ok: true, url: response.data.url }
    : { ok: false, error: failure(response) };
}

/**
 * Ask the CRM to re-read the Connect account from Stripe and store its flags.
 * The webhook does the same, but not always before the mechanic is back.
 */
export async function refreshStripeStatus(): Promise<
  { ok: true; payoutsEnabled: boolean } | { ok: false; error: string }
> {
  const response = await api.post<{ payoutsEnabled: boolean }>('/mechanic/stripe/refresh');
  return response.ok
    ? { ok: true, payoutsEnabled: response.data.payoutsEnabled }
    : { ok: false, error: failure(response) };
}

/** The CRM's bounds on `mechanics.daily_goal_pence`. */
export const GOAL_MIN_PENCE = 1000;
export const GOAL_MAX_PENCE = 200_000;

/** What they want to earn in a day — theirs to set, written direct under RLS. */
export async function updateDailyGoal(
  mechanicId: string,
  goalPence: number | null,
): Promise<ActionResult> {
  if (goalPence !== null && (goalPence < GOAL_MIN_PENCE || goalPence > GOAL_MAX_PENCE)) {
    return { ok: false, error: 'Pick a goal between £10 and £2,000.' };
  }

  const { error } = await supabase
    .from('mechanics')
    .update({ daily_goal_pence: goalPence })
    .eq('id', mechanicId);

  return error ? { ok: false, error: FAILED } : { ok: true };
}

/** When a spell offline should end by itself. The CRM works out `next_shift` from their hours. */
export type Resume = { minutes: 30 | 60 } | { at: 'next_shift' };

/**
 * Go online or offline, optionally coming back by itself. Also how a mechanic
 * who is already offline sets, changes or clears that timer.
 *
 * Through the CRM rather than a direct write, although
 * RLS would allow one: the CRM refuses `online` without payouts, and on going
 * online re-offers any booking still waiting for a mechanic. A direct write
 * would skip both.
 */
export async function setOnlineStatus(
  status: 'online' | 'offline',
  resume?: Resume,
): Promise<
  | { ok: true; status: 'online' | 'offline'; resumeAt: string | null }
  | { ok: false; error: string }
> {
  const response = await api.post<{ status: 'online' | 'offline'; resumeAt?: string | null }>(
    '/mechanic/status',
    { status, ...(status === 'offline' && resume ? { resume } : {}) },
  );
  return response.ok
    ? { ok: true, status: response.data.status, resumeAt: response.data.resumeAt ?? null }
    : { ok: false, error: failure(response) };
}
