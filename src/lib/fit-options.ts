/**
 * A part NAPA lists in versions for cars with and without air-con (or
 * stop-start), as the CRM records it on the job's part line:
 * `booking_parts.fit_options` (CRM migration 0093).
 *
 * Ported from the CRM's `lib/parts/fit-options.ts` (`readFitOptions`,
 * `fitOptionsHeading`, `isChargedOption`); the wording must stay identical to
 * the website's mechanic job page. The column is jsonb, so `readFitOptions`
 * checks its shape rather than trusting it. Pure.
 */

export type EquipmentKey = 'air_con' | 'stop_start';

export interface FitOption {
  supplier: 'aag';
  partNumber: string;
  brand: string | null;
  description: string | null;
  for: Partial<Record<EquipmentKey, boolean>>;
  /** "With air-con" */
  label: string;
}

export interface FitOptions {
  dependsOn: EquipmentKey[];
  options: FitOption[];
  /** What the customer said at booking; a key is missing when they weren't sure or weren't asked. */
  answered?: Partial<Record<EquipmentKey, boolean>>;
}

const KEYS: readonly EquipmentKey[] = ['air_con', 'stop_start'];

function isKey(value: unknown): value is EquipmentKey {
  return value === 'air_con' || value === 'stop_start';
}

/** A stored fit_options value, or null when absent or not the shape the CRM writes. */
export function readFitOptions(raw: unknown): FitOptions | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const dependsOn = Array.isArray(value.dependsOn) ? value.dependsOn.filter(isKey) : [];
  const options = Array.isArray(value.options)
    ? value.options.flatMap((o): FitOption[] => {
        if (!o || typeof o !== 'object') return [];
        const opt = o as Record<string, unknown>;
        if (typeof opt.partNumber !== 'string' || !opt.partNumber) return [];
        const forRaw = (opt.for && typeof opt.for === 'object' ? opt.for : {}) as Record<string, unknown>;
        const forKinds: FitOption['for'] = {};
        for (const key of KEYS) if (typeof forRaw[key] === 'boolean') forKinds[key] = forRaw[key] as boolean;
        return [
          {
            supplier: 'aag',
            partNumber: opt.partNumber,
            brand: typeof opt.brand === 'string' ? opt.brand : null,
            description: typeof opt.description === 'string' ? opt.description : null,
            for: forKinds,
            label: typeof opt.label === 'string' ? opt.label : '',
          },
        ];
      })
    : [];
  if (dependsOn.length === 0 || options.length < 2) return null;
  const answeredRaw = (value.answered && typeof value.answered === 'object' ? value.answered : {}) as Record<
    string,
    unknown
  >;
  const answered: Partial<Record<EquipmentKey, boolean>> = {};
  for (const key of dependsOn) if (typeof answeredRaw[key] === 'boolean') answered[key] = answeredRaw[key] as boolean;
  return { dependsOn, options, ...(Object.keys(answered).length > 0 ? { answered } : {}) };
}

const NAME: Record<EquipmentKey, string> = { air_con: 'air-con', stop_start: 'stop-start' };

/** "air-con", "air-con and stop-start". */
function names(keys: readonly EquipmentKey[]): string {
  return keys.map((k) => NAME[k]).join(' and ');
}

/** Whether some equipment this part depends on is unknown: the mechanic must check before buying. */
export function fitOptionsUnsure(fit: FitOptions): boolean {
  return fit.dependsOn.some((key) => fit.answered?.[key] === undefined);
}

/** What the customer said, in a sentence: "The customer said the car has air-con." Null when nothing. */
export function customerSaid(fit: FitOptions): string | null {
  const said = fit.dependsOn.filter((key) => fit.answered?.[key] !== undefined);
  if (said.length === 0) return null;
  const parts = said.map((key) => `${fit.answered?.[key] ? 'has' : "doesn't have"} ${NAME[key]}`);
  return `The customer said the car ${parts.join(' and ')}.`;
}

/** The heading over the versions: what to check, and why. */
export function fitOptionsHeading(fit: FitOptions): string {
  const unknown = fit.dependsOn.filter((key) => fit.answered?.[key] === undefined);
  if (unknown.length > 0) return `Check ${names(unknown)} before buying: we don't know which this car has.`;
  return `${customerSaid(fit) ?? ''} If not, buy the other version.`.trim();
}

/** Whether an option is the one the line was charged as. */
export function isChargedOption(option: FitOption, chargedPartNumber: string | null | undefined): boolean {
  return !!chargedPartNumber && option.partNumber === chargedPartNumber;
}
