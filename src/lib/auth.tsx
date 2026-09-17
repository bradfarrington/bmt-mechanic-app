import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Mechanic = Database['public']['Tables']['mechanics']['Row'];

export interface AuthState {
  session: Session | null;
  user: User | null;
  /** The `profiles` row — the canonical source for their name. */
  profile: Profile | null;
  /**
   * The `mechanics` row: status, service area, specialisms and the Stripe
   * payout flags. Null until loaded.
   */
  mechanic: Mechanic | null;
  fullName: string | null;
  /** First word of the full name, for greetings. Falls back to `null`. */
  firstName: string | null;
  /**
   * True until the persisted session has been restored from storage and, when
   * there is one, its mechanic record has been read — the entry router needs
   * both to pick between onboarding and Today.
   */
  initialising: boolean;
  /**
   * Set when an account was signed out again because it is not a mechanic's.
   * The login screen reads it to explain why they landed back there — without
   * it the sign-out looks like a silent failure.
   */
  notMechanic: boolean;
}

/**
 * This app is for mechanics. A customer holds a perfectly valid Supabase
 * session, so nothing about the token stops them signing in — the refusal has
 * to be an explicit check.
 *
 * "Is a mechanic" means **has a `mechanics` row**, not `role === 'mechanic'`:
 * an admin who also works jobs keeps `role = 'admin'` and is granted mechanic
 * access by the row. Same rule as the CRM's `require-mechanic.ts` and proxy.
 */
const NOT_MECHANIC_MESSAGE =
  "This account isn't set up as a mechanic. If you're a customer, use the " +
  'Book My Tech app instead.';

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /**
   * Email a recovery link. Resolves without error whether or not the address
   * has an account — see the implementation.
   */
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  /** Set a new password. The emailed link is the proof of ownership. */
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  /** Re-read the mechanic row after changing it — onboarding, payouts, status. */
  refreshMechanic: () => Promise<void>;
}

/**
 * Where a recovery link comes back to.
 *
 * Derived from `expo.scheme` rather than written out, so it cannot drift from
 * app.json. **This exact URL must be allow-listed** in Supabase → Authentication
 * → URL Configuration → Redirect URLs, or the link in the email lands on the
 * project's site URL instead and the mechanic never reaches the app.
 *
 * `/reset-password` and `/set-password` deliberately sit outside the `(auth)`
 * group: a recovery link *establishes a session*, and `(auth)/_layout`
 * redirects any session straight into the app — so a screen for setting the
 * new password could never be reached from inside it.
 */
export const PASSWORD_RESET_REDIRECT = 'reset-password';

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

function resolveFullName(profile: Profile | null, user: User | null) {
  const fromProfile = profile?.full_name?.trim();
  if (fromProfile) return fromProfile;

  const fromMetadata = (user?.user_metadata?.full_name as string | undefined)
    ?.trim();
  return fromMetadata || null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);
  /** The user whose records have been read (or found unreadable). */
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [notMechanic, setNotMechanic] = useState(false);

  useEffect(() => {
    let active = true;

    // Restore whatever LargeSecureStore has, then keep in step with every
    // subsequent auth event (refresh, sign-out, token revocation).
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSessionRestored(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        setSession(next);
        // Clearing here rather than in the fetch effect keeps that effect free
        // of synchronous state writes.
        if (!next) {
          setProfile(null);
          setMechanic(null);
          setLoadedFor(null);
        }
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id;

  const loadRecords = useCallback(async (id: string) => {
    const [profileResult, mechanicResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('mechanics').select('*').eq('id', id).maybeSingle(),
    ]);

    // `unreadable` separates "the request failed" from "there is no row". Only
    // the second is evidence about the account — the first is a flat tyre, and
    // ejecting a mechanic over one would lock them out mid-shift.
    return {
      profile: profileResult.data ?? null,
      mechanic: mechanicResult.data ?? null,
      unreadable: !!mechanicResult.error,
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    loadRecords(userId).then((next) => {
      if (!active) return;
      setProfile(next.profile);
      setMechanic(next.mechanic);
      setLoadedFor(userId);

      // Catches a customer session restored from storage, and a mechanic
      // removed underneath a live one — sign-in is not the only way in.
      if (!next.unreadable && !next.mechanic) {
        setNotMechanic(true);
        supabase.auth.signOut();
      }
    });

    return () => {
      active = false;
    };
  }, [userId, loadRecords]);

  const refreshMechanic = useCallback(async () => {
    if (!userId) return;
    const next = await loadRecords(userId);
    // A failed refresh keeps whatever was already loaded.
    if (next.unreadable) return;
    setProfile(next.profile);
    setMechanic(next.mechanic);
  }, [userId, loadRecords]);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    const fullName = resolveFullName(profile, user);

    return {
      session,
      user,
      profile,
      mechanic,
      fullName,
      firstName: fullName ? (fullName.split(/\s+/)[0] ?? null) : null,
      initialising: !sessionRestored || (!!userId && loadedFor !== userId),
      notMechanic,

      async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) return { error: error.message };

        // Checked here as well as in the provider so the refusal arrives as an
        // answer to the button they just pressed. The provider's eject would
        // otherwise bounce them back to this screen with no explanation of why
        // a correct password appeared not to work.
        const id = data.user?.id;
        if (id) {
          const next = await loadRecords(id);
          if (!next.unreadable && !next.mechanic) {
            setNotMechanic(true);
            await supabase.auth.signOut();
            return { error: NOT_MECHANIC_MESSAGE };
          }
        }

        setNotMechanic(false);
        return { error: null };
      },

      async signOut() {
        await supabase.auth.signOut();
      },

      /**
       * Supabase answers this the same way for an address it knows and one it
       * does not — deliberately. So an `error` here means the request itself
       * failed (offline, rate limited), never "no such account", and the
       * screen must not imply otherwise.
       */
      async sendPasswordReset(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: Linking.createURL(PASSWORD_RESET_REDIRECT) },
        );
        return { error: error ? error.message : null };
      },

      /**
       * Only works while the recovery session is live, which is the point: the
       * link in the email *is* the proof of ownership, so no current password
       * is asked for.
       */
      async updatePassword(password: string) {
        const { error } = await supabase.auth.updateUser({ password });
        return { error: error ? error.message : null };
      },

      refreshMechanic,
    };
  }, [
    session,
    profile,
    mechanic,
    sessionRestored,
    loadedFor,
    userId,
    notMechanic,
    loadRecords,
    refreshMechanic,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
