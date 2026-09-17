import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { Env } from '@/lib/env';
import { LargeSecureStore } from '@/lib/secure-storage';
import type { Database } from '@/types/database';

/**
 * The same Supabase project the CRM uses. Reads go through this client under
 * RLS — customers can only see their own bookings, events, messages and
 * reminders. Writes go through the CRM's `/api/mobile/*` layer instead; see
 * docs/00-build-plan.md.
 */
export const supabase = createClient<Database>(
  Env.supabaseUrl,
  Env.supabaseAnonKey,
  {
    auth: {
      storage: LargeSecureStore,
      autoRefreshToken: true,
      persistSession: true,
      // No URL to parse on native — this is a browser-only concern, and leaving
      // it on makes supabase-js touch `window`.
      detectSessionInUrl: false,
    },
  },
);

/**
 * Supabase's timer-based refresh does not run while the app is suspended, so a
 * backgrounded app wakes with a stale token. Drive the refresh off foreground
 * transitions instead.
 */
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
