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

import { requestAccountDeletion } from '@/lib/account';
import { unregisterForPush } from '@/lib/push';
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
  /**
   * Set once the CRM has deleted the account and this device has signed out,
   * so the login screen can say so rather than look like a failed session.
   */
  accountDeleted: boolean;
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
  /**
   * Set a new password. The emailed link is the proof of ownership; from
   * Account, `verifyPassword` must have run first.
   */
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  /**
   * Check the current password by signing in with it, which also mints a
   * session under 24 hours old — what Supabase's "secure password change"
   * rule wants before a password change without an emailed code.
   */
  verifyPassword: (password: string) => Promise<{ error: string | null }>;
  /** Ask the CRM to delete the account, then sign this device out. */
  deleteAccount: () => Promise<{ error: string | null }>;
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
  const [accountDeleted, setAccountDeleted] = useState(false);

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
      accountDeleted,

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
        setAccountDeleted(false);
        return { error: null };
      },

      async signOut() {
        // Before the session goes — the removal call needs the token. A shared
        // phone must not keep getting the previous mechanic's offers.
        await unregisterForPush();
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

      async verifyPassword(password: string) {
        const email = session?.user?.email;
        if (!email) return { error: 'You need to be signed in.' };

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) return { error: null };
        // Supabase's wording is for a sign-in form. Here the email is known to
        // be right, so only one thing can be wrong.
        return { error: error.status === 400 ? "That password isn't right." : error.message };
      },

      async deleteAccount() {
        const result = await requestAccountDeletion();
        if (!result.ok) return { error: result.error };

        // Flagged before the sign-out so the login screen can explain the
        // empty session. Local scope only: the CRM has already revoked every
        // session, and a deleted user's token asking for a global sign-out
        // would only be refused. Push was unregistered server-side too.
        setAccountDeleted(true);
        await supabase.auth.signOut({ scope: 'local' });
        return { error: null };
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
    accountDeleted,
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
