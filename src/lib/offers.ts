import { api, rateLimitMessage, type ApiResult } from '@/lib/api';

/**
 * Job offers. Read from the CRM rather than from `bookings`: an offered
 * booking's row carries the customer's name, phone and address, which a
 * mechanic has no business seeing until the job is theirs. The CRM's summary
 * stops at the postcode district.
 *
 * Offers do not expire — one ends when somebody accepts it or this mechanic
 * declines — so there is no countdown to run, only "offered 2 min ago".
 */
export interface Offer {
  offerId: string;
  bookingId: string;
  offeredAt: string;
  vehicle: { reg: string | null; make: string | null; model: string | null };
  repairDescription: string | null;
  repairs: { description: string; hours: number | null }[];
  /** Postcode district only — "SE15". */
  area: string | null;
  distanceMiles: number | null;
  /** Ready to show — "Today 2–4pm". */
  when: string | null;
  scheduledAt: string | null;
  slotWindow: string | null;
  candidateDays: string[] | null;
  /** All-day or flexible: accepting it leads straight to picking a window. */
  needsArrivalWindow: boolean;
  payoutPence: number | null;
  specialInstructions: string | null;
}

export type OfferFailure = {
  ok: false;
  error: string;
  /** 409 — somebody else accepted it, or it was already answered. */
  taken: boolean;
  /** 404 / 403 — it no longer exists, or was never this mechanic's. */
  gone: boolean;
};

function failure(response: Extract<ApiResult<unknown>, { ok: false }>): OfferFailure {
  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
    taken: response.status === 409,
    gone: response.status === 404 || response.status === 403,
  };
}

export async function fetchOffers(
  signal?: AbortSignal,
): Promise<{ ok: true; offers: Offer[] } | OfferFailure> {
  const response = await api.get<{ offers: Offer[] }>('/mechanic/offers', { signal });
  return response.ok ? { ok: true, offers: response.data.offers ?? [] } : failure(response);
}

/** One offer, for a push deep link. `offer` is null once it has been answered. */
export async function fetchOffer(
  offerId: string,
): Promise<{ ok: true; offer: Offer | null } | OfferFailure> {
  const response = await api.get<{ offers: Offer[] }>(
    `/mechanic/offers?offerId=${encodeURIComponent(offerId)}`,
  );
  return response.ok
    ? { ok: true, offer: response.data.offers?.[0] ?? null }
    : failure(response);
}

export async function acceptOffer(
  offerId: string,
): Promise<{ ok: true; bookingId: string; needsArrivalWindow: boolean } | OfferFailure> {
  const response = await api.post<{ bookingId: string; needsArrivalWindow: boolean }>(
    `/mechanic/offers/${encodeURIComponent(offerId)}/accept`,
  );
  return response.ok ? { ok: true, ...response.data } : failure(response);
}

export async function declineOffer(offerId: string): Promise<{ ok: true } | OfferFailure> {
  const response = await api.post(`/mechanic/offers/${encodeURIComponent(offerId)}/decline`);
  return response.ok ? { ok: true } : failure(response);
}

export interface ArrivalOption {
  window: string;
  startHour: number;
  iso: string;
  bookable: boolean;
  /** Advisory: outside the mechanic's working hours, but still allowed. */
  outsideHours: boolean;
  /** A hard block: it overlaps another of their jobs. `jobNumber` is ready to print — "00123". */
  clash: { bookingId: string; jobNumber: string; window: string } | null;
  /** The only flag that decides whether the option can be picked. */
  selectable: boolean;
}

export interface ArrivalDay {
  dayKey: string;
  label: string;
  options: ArrivalOption[];
  hours: unknown;
  dayOff: boolean;
  allDayJobs: unknown;
  anySelectable: boolean;
}

/** One day for an all-day job, several for a flexible one. The list is the CRM's — never hard-code it. */
export async function fetchArrivalWindows(
  bookingId: string,
): Promise<{ ok: true; needsArrivalWindow: boolean; days: ArrivalDay[] } | OfferFailure> {
  const response = await api.get<{ needsArrivalWindow: boolean; days: ArrivalDay[] }>(
    `/mechanic/bookings/${encodeURIComponent(bookingId)}/arrival-windows`,
  );
  return response.ok
    ? { ok: true, needsArrivalWindow: response.data.needsArrivalWindow, days: response.data.days ?? [] }
    : failure(response);
}

/** Can only be done once per booking — a second attempt is a 409. */
export async function setArrivalWindow(
  bookingId: string,
  input: { window: string; dayKey: string },
): Promise<{ ok: true } | OfferFailure> {
  const response = await api.post(
    `/mechanic/bookings/${encodeURIComponent(bookingId)}/arrival-window`,
    input,
  );
  return response.ok ? { ok: true } : failure(response);
}

/** "£72", "£1,240", "£54.50" — whole pounds unless there are pence to show. */
export function formatPence(pence: number | null | undefined) {
  if (pence == null) return '—';
  const pounds = pence / 100;
  const digits = Number.isInteger(pounds) ? 0 : 2;
  return `£${pounds.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

/** "New" for the first minute, then "3m ago", "2h ago". */
export function offeredAgo(offeredAt: string, now: number = Date.now()) {
  const minutes = Math.floor((now - new Date(offeredAt).getTime()) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) return 'New';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function offerTitle(offer: Offer) {
  return offer.repairDescription?.trim() || offer.repairs[0]?.description || 'Repair';
}

export function offerVehicle(offer: Offer) {
  const name = [offer.vehicle.make, offer.vehicle.model].filter(Boolean).join(' ');
  return name || 'Vehicle';
}

export function offerWhere(offer: Offer) {
  const distance = offer.distanceMiles != null ? `${offer.distanceMiles.toFixed(1)} mi` : null;
  return [offer.area, distance].filter(Boolean).join(' · ') || 'Nearby';
}
