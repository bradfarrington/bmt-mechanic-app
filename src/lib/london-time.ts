/**
 * Europe/London wall-clock time.
 *
 * Bookings are made for a UK arrival window, so everything about them is
 * London time regardless of the phone: "8am" is 8am in the road the mechanic
 * turns up on, whether the customer is booking from Manchester, Málaga or a
 * device whose zone is set wrong. The CRM applies the same rule server-side
 * (`bookmytech`, 2026-08-27), so building instants here in any other zone
 * would have it refuse windows the app had just offered.
 *
 * Hermes ships full `Intl` on both platforms, including `timeZone` and
 * `formatToParts`, so no library is needed to do this properly.
 */
export const LONDON_TZ = 'Europe/London';

export interface LondonParts {
  year: number;
  /** 1–12, not the `Date` 0-based month. */
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: LONDON_TZ,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hourCycle: 'h23',
});

/** The London wall-clock reading at an instant. */
export function londonParts(at: Date): LondonParts {
  const out: Record<string, number> = {};
  for (const part of PARTS.formatToParts(at)) {
    if (part.type !== 'literal') out[part.type] = Number(part.value);
  }
  return {
    year: out.year ?? 0,
    month: out.month ?? 1,
    day: out.day ?? 1,
    // Some engines print midnight as "24" under h23; normalise.
    hour: (out.hour ?? 0) % 24,
    minute: out.minute ?? 0,
    second: out.second ?? 0,
  };
}

/** London's UTC offset at an instant, in minutes: 0 under GMT, 60 under BST. */
export function londonOffsetMinutes(at: Date): number {
  const p = londonParts(at);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/**
 * The instant at which a London wall-clock time occurs — `(2026, 8, 27, 8)`
 * is 8am BST, i.e. `2026-08-27T07:00:00.000Z`.
 *
 * Two passes: the offset is first read at the wall time taken as UTC, then
 * re-read at the resulting instant. They only differ within an hour of a
 * clock change, which no arrival window straddles (both happen at 1am).
 */
export function londonInstant(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const guess = wall - londonOffsetMinutes(new Date(wall)) * 60_000;
  const settled = wall - londonOffsetMinutes(new Date(guess)) * 60_000;
  return new Date(settled);
}

/** `toLocaleDateString('en-GB', …)`, but always in London time. */
export function formatLondon(
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: LONDON_TZ }).format(
    date,
  );
}

/**
 * `YYYY-MM-DD` — a London calendar day, in the one shape the CRM stores and
 * accepts (`bookings.candidate_days` is a `date[]`).
 *
 * Branded so a key can only be made by `dayKey`, never typed or converted
 * from an instant by hand. The booking endpoint drops any candidate day that
 * is not exactly this shape and, if fewer than two survive, quietly writes an
 * ordinary single all-day booking rather than refusing — so a stray ISO
 * instant would not error, it would lose the customer's other days without
 * anyone noticing. Making the wrong shape unrepresentable is cheaper than
 * finding that out from a customer.
 */
export type DayKey = string & { readonly __dayKey: true };

/** The key for a London calendar day. `month` is 1–12. */
export function dayKey(year: number, month: number, day: number): DayKey {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}` as DayKey;
}

/** The key of the London calendar day an instant falls on. */
export function londonDayKey(at: Date): DayKey {
  const p = londonParts(at);
  return dayKey(p.year, p.month, p.day);
}

/**
 * An instant to format a stored day at.
 *
 * A `DayKey` — a `date` column, or one of this app's own — becomes noon
 * London on that day, so the weekday and date it prints as are that day's
 * whichever way the clocks are set. Anything else is read as an instant, which
 * is how an event payload's `to` arrives. Null for a value that is neither, so
 * a caller can leave it out rather than print "Invalid Date".
 */
export function dayInstant(value: string): Date | null {
  const key = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (key) {
    return londonInstant(Number(key[1]), Number(key[2]), Number(key[3]), 12);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Sat 14 Sep" — the London day of an instant. */
export function formatDay(date: Date): string {
  return formatLondon(date, { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * "Sat 14, Sun 15 or Mon 16 Sep" — several days as one phrase, in the order
 * given. The month is written once per run of days that share it, so five days
 * in one month do not name it five times on a card.
 */
export function formatDayList(days: readonly Date[]): string {
  const parts = days.map((day, index) => {
    const label = formatLondon(day, { weekday: 'short', day: 'numeric' });
    const month = formatLondon(day, { month: 'short' });
    const next = days[index + 1];
    const nextShares = !!next && formatLondon(next, { month: 'short' }) === month;
    return nextShares ? label : `${label} ${month}`;
  });

  if (parts.length < 2) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}`;
}
