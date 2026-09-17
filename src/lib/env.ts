/**
 * Public runtime config, read from `.env` (see `.env.example`).
 *
 * `EXPO_PUBLIC_`-prefixed vars are inlined into the bundle by Metro at build
 * time, so everything here is readable by anyone who downloads the app. That is
 * fine for these three — the Supabase URL and anon key already ship in the
 * CRM's browser bundle, and RLS is what actually protects the data. Nothing
 * secret (service-role key, DVLA key, HaynesPro credentials) may be added: it
 * would be extractable from the binary. Those stay server-side in the CRM.
 *
 * Metro can only inline a *statically written* `process.env.EXPO_PUBLIC_X`, so
 * these must be spelled out in full rather than looked up dynamically.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill it in, then restart ` +
        `the dev server — Metro inlines env vars at build time, so a running ` +
        `server will not pick up the change.`,
    );
  }
  return value;
}

export const Env = {
  supabaseUrl: required(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    'EXPO_PUBLIC_SUPABASE_URL',
  ),
  supabaseAnonKey: required(
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ),
  /** Base URL of the CRM deployment hosting `/api/mobile/*` (phase 1). */
  apiBaseUrl: required(
    process.env.EXPO_PUBLIC_API_BASE_URL,
    'EXPO_PUBLIC_API_BASE_URL',
  ),
} as const;
