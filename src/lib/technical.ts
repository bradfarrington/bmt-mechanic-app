import { api, rateLimitMessage, type ApiResult } from '@/lib/api';

/**
 * The manufacturer's repair manuals and technical data for a job's vehicle —
 * HaynesPro, read through the CRM (`GET /mechanic/bookings/:id/technical/*`),
 * which holds the credentials and maps HaynesPro's payloads to these shapes.
 * The app's twin of the website's `/mechanic/jobs/[id]/technical`.
 */

/** A line of a manual or an ID-plate location; `lines` nest to any depth. */
export interface StoryLine {
  name: string | null;
  text: string | null;
  remark: string | null;
  /** JPEG or SVGZ on haynespro-assets.com. */
  imageUrl: string | null;
  lines: StoryLine[];
}

/** A specification row. One with `rows` is a heading over them. */
export interface DataRow {
  name: string | null;
  value: string | null;
  unit: string | null;
  remark: string | null;
  rows: DataRow[];
}

export interface Manuals {
  /** False when the reg didn't match a HaynesPro vehicle: nothing to show. */
  matched: boolean;
  /** HaynesPro's name for the car, e.g. "Focus III 1.0 EcoBoost". */
  vehicle: string | null;
  manuals: { storyId: number; name: string }[];
}

export interface Manual {
  name: string;
  lines: StoryLine[];
}

export interface TechnicalData {
  matched: boolean;
  vehicle: string | null;
  /** One collapsible group each. */
  adjustments: DataRow[];
  capacities: DataRow[];
  /** One list of lines per location. */
  idLocations: StoryLine[][];
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function read<T>(url: string): Promise<Result<T>> {
  const response: ApiResult<T> = await api.get<T>(url);
  if (response.ok) return { ok: true, data: response.data };
  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
  };
}

const base = (bookingId: string) =>
  `/mechanic/bookings/${encodeURIComponent(bookingId)}/technical`;

export const fetchManuals = (bookingId: string) => read<Manuals>(`${base(bookingId)}/manuals`);

export const fetchManual = (bookingId: string, storyId: number) =>
  read<Manual>(`${base(bookingId)}/manuals/${storyId}`);

export const fetchTechnicalData = (bookingId: string) =>
  read<TechnicalData>(`${base(bookingId)}/data`);
