import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Alert, AppState } from 'react-native';

import { useAuth } from '@/lib/auth';
import { setOnlineStatus, type Resume } from '@/lib/mechanic';
import { supabase } from '@/lib/supabase';

/**
 * What the mechanic is doing right now — the tab bar's centre button shows it
 * on every hub screen.
 *
 * - `online` / `offline` — theirs to toggle.
 * - `on_job` — a booking is en route or in progress; locked until it ends.
 * - `locked` — payouts are not set up yet, so they cannot take work.
 */
export type MechanicStatus = 'online' | 'offline' | 'on_job' | 'locked';

interface StatusValue {
  status: MechanicStatus;
  /** A toggle is on its way to the CRM. */
  pending: boolean;
  /** Online ↔ Offline. Does nothing while on a job or locked. */
  toggle: () => void;
  /**
   * Go offline — or, already offline, set when to come back. `resume` omitted
   * means until they say otherwise, which also cancels a timer.
   */
  goOffline: (resume?: Resume) => void;
  /** When a timed spell offline ends, if one is running. */
  resumeAt: string | null;
  /** The booking they are driving to or working on, if any. */
  activeJobId: string | null;
  /** Re-read after anything that starts or ends a job. */
  refreshStatus: () => Promise<void>;
}

const StatusContext = createContext<StatusValue | null>(null);

/** Reads `mechanics.status` and the payouts flag; must sit inside `AuthProvider`. */
export function StatusProvider({ children }: { children: ReactNode }) {
  const { mechanic, refreshMechanic } = useAuth();
  // What was just asked for, shown until the CRM's answer is read back.
  const [requested, setRequested] = useState<'online' | 'offline' | null>(null);

  const mechanicId = mechanic?.id;
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // The CRM's job lifecycle never moves `mechanics.status` to `on_job`, so "On a
  // job" is read off the bookings: one of theirs is en route or in progress.
  // A promise, not an async function: state is only written inside the
  // `.then`, so the effect below never sets state synchronously.
  const loadActiveJob = useCallback((): Promise<void> => {
    if (!mechanicId) return Promise.resolve();
    return Promise.resolve(
      supabase
        .from('bookings')
        .select('id')
        .eq('mechanic_id', mechanicId)
        .in('status', ['en_route', 'in_progress'])
        .order('en_route_at', { ascending: false })
        .limit(1),
    ).then(({ data, error }) => {
      if (!error) setActiveJobId(data[0]?.id ?? null);
    });
  }, [mechanicId]);

  useEffect(() => {
    void loadActiveJob();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void loadActiveJob();
    });
    return () => subscription.remove();
  }, [loadActiveJob]);

  const stored: MechanicStatus = !mechanic
    ? 'offline'
    : mechanic.status === 'on_job' || activeJobId
      ? 'on_job'
      : !mechanic.stripe_payouts_enabled
        ? 'locked'
        : mechanic.status === 'online'
          ? 'online'
          : 'offline';

  const togglable = stored === 'online' || stored === 'offline';
  const status = togglable && requested ? requested : stored;

  async function change(next: 'online' | 'offline', resume?: Resume) {
    if (!togglable || requested) return;
    setRequested(next);

    const result = await setOnlineStatus(next, resume);
    if (result.ok) {
      await refreshMechanic();
    } else {
      Alert.alert(next === 'online' ? "Couldn't go online" : "Couldn't go offline", result.error);
    }
    setRequested(null);
  }

  const resumeAt = status === 'offline' ? (mechanic?.resume_online_at ?? null) : null;

  return (
    <StatusContext.Provider
      value={{
        status,
        pending: requested !== null,
        toggle: () => void change(stored === 'online' ? 'offline' : 'online'),
        goOffline: (resume) => void change('offline', resume),
        resumeAt,
        activeJobId: mechanic ? activeJobId : null,
        refreshStatus: loadActiveJob,
      }}
    >
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus(): StatusValue {
  const value = useContext(StatusContext);
  if (!value) throw new Error('useStatus must be used inside <StatusProvider>');
  return value;
}
