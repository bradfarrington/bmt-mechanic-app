import { dayInstant, formatLondon, londonDayKey, londonInstant, londonParts } from '@/lib/london-time';
import { supabase } from '@/lib/supabase';

/**
 * The mechanic's own bookings, read straight from Supabase — RLS shows a
 * mechanic the bookings assigned to them. Every status change goes through the
 * CRM; nothing here writes.
 */
const JOB_COLUMNS =
  'id, job_number, status, scheduled_at, slot_window, candidate_days, repair_description, ' +
  'vehicle_make, vehicle_model, vehicle_reg, postcode, area, mechanic_payout_pence, ' +
  'service_duration_hours, completed_at';

export interface Job {
  id: string;
  job_number: number | null;
  status: string;
  scheduled_at: string | null;
  slot_window: string | null;
  candidate_days: string[] | null;
  repair_description: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_reg: string;
  postcode: string;
  area: string | null;
  mechanic_payout_pence: number | null;
  service_duration_hours: number | null;
  completed_at: string | null;
}

/** Work still to do, or under way. */
const OPEN = ['confirmed', 'en_route', 'in_progress'];

/** Midnight to midnight, London — a job is "today" by the road it happens on, not the phone's zone. */
function londonDay(at: Date) {
  const { year, month, day } = londonParts(at);
  return { start: londonInstant(year, month, day), end: londonInstant(year, month, day + 1) };
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Monday 00:00 London of the week containing `at`. */
function londonWeekStart(at: Date) {
  const { year, month, day } = londonParts(at);
  const sinceMonday = Math.max(0, WEEKDAYS.indexOf(formatLondon(at, { weekday: 'short' })));
  return londonInstant(year, month, day - sinceMonday);
}

export interface TodaySummary {
  /** Today's jobs, earliest first — open ones and any already completed. */
  jobs: Job[];
  /** Payout across today's jobs, done or not. */
  bookedPence: number;
  /** Payout across jobs completed since Monday. */
  weekPence: number;
  weekJobs: number;
}

export async function loadToday(
  mechanicId: string,
  now: Date = new Date(),
): Promise<{ ok: true; summary: TodaySummary } | { ok: false; error: string }> {
  const { start, end } = londonDay(now);

  const [today, week] = await Promise.all([
    supabase
      .from('bookings')
      .select(JOB_COLUMNS)
      .eq('mechanic_id', mechanicId)
      .in('status', [...OPEN, 'completed'])
      .gte('scheduled_at', start.toISOString())
      .lt('scheduled_at', end.toISOString())
      .order('scheduled_at', { ascending: true })
      .returns<Job[]>(),
    supabase
      .from('bookings')
      .select('mechanic_payout_pence')
      .eq('mechanic_id', mechanicId)
      .eq('status', 'completed')
      .gte('completed_at', londonWeekStart(now).toISOString()),
  ]);

  if (today.error || week.error) {
    return { ok: false, error: "Couldn't load your day. Pull down to try again." };
  }

  const sum = (rows: { mechanic_payout_pence: number | null }[]) =>
    rows.reduce((total, row) => total + (row.mechanic_payout_pence ?? 0), 0);

  return {
    ok: true,
    summary: {
      jobs: today.data,
      bookedPence: sum(today.data),
      weekPence: sum(week.data),
      weekJobs: week.data.length,
    },
  };
}

/** A London day's jobs, earliest first, cancelled ones left out. `day` is a `YYYY-MM-DD` key. */
export async function loadDay(
  mechanicId: string,
  day: string,
): Promise<{ ok: true; jobs: Job[] } | { ok: false; error: string }> {
  // A day key reads as London noon; its calendar day is what matters.
  const at = dayInstant(day);
  if (!at) return { ok: false, error: 'That day isn’t valid.' };
  const { start, end } = londonDay(at);

  const { data, error } = await supabase
    .from('bookings')
    .select(JOB_COLUMNS)
    .eq('mechanic_id', mechanicId)
    .in('status', [...OPEN, 'completed'])
    .gte('scheduled_at', start.toISOString())
    .lt('scheduled_at', end.toISOString())
    .order('scheduled_at', { ascending: true })
    .returns<Job[]>();

  return error
    ? { ok: false, error: "Couldn't load those jobs. Try again in a moment." }
    : { ok: true, jobs: data };
}

/** The London day after `now`, as a key. */
export function tomorrowKey(now: Date = new Date()) {
  const { year, month, day } = londonParts(now);
  return londonDayKey(londonInstant(year, month, day + 1, 12));
}

export function isOpen(job: Pick<Job, 'status'>) {
  return OPEN.includes(job.status);
}

/** "10:00" — the window's start, London time. */
export function jobStartTime(job: Pick<Job, 'scheduled_at'>) {
  if (!job.scheduled_at) return '—';
  return formatLondon(new Date(job.scheduled_at), { hour: '2-digit', minute: '2-digit' });
}

/** "1h 15m" */
export function jobDuration(job: Pick<Job, 'service_duration_hours'>) {
  const hours = job.service_duration_hours;
  if (!hours || hours <= 0) return null;
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  return [whole ? `${whole}h` : null, minutes ? `${minutes}m` : null].filter(Boolean).join(' ');
}

export function jobVehicle(job: Pick<Job, 'vehicle_make' | 'vehicle_model'>) {
  return [job.vehicle_make, job.vehicle_model].filter(Boolean).join(' ') || 'Vehicle';
}

/** The outward half of the postcode — "SE15" — which is all a list row needs. */
export function jobDistrict(job: Pick<Job, 'postcode' | 'area'>) {
  return job.area?.trim() || job.postcode.trim().split(/\s+/)[0] || job.postcode;
}
