/**
 * UK postcodes, as the CRM stores them — sometimes "B77 2RL", sometimes
 * "B772RL". The inward code is always the last three characters, so the split
 * is made there rather than on a space that may not exist.
 */

function compact(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\s+/g, '').toUpperCase();
}

/** "B772RL" → "B77 2RL". Anything too short to split comes back as typed. */
export function formatPostcode(raw: string | null | undefined): string {
  const code = compact(raw);
  return code.length > 3 ? `${code.slice(0, -3)} ${code.slice(-3)}` : code;
}

/** The outward code — "B77" from "B772RL" or "B77 2RL". Empty when there is none. */
export function postcodeDistrict(raw: string | null | undefined): string {
  const code = compact(raw);
  return code.length > 3 ? code.slice(0, -3) : code;
}
