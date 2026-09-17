import { createContext, useContext, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/lib/auth';
import { setOnlineStatus, type Resume } from '@/lib/mechanic';

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
}

const StatusContext = createContext<StatusValue | null>(null);

/** Reads `mechanics.status` and the payouts flag; must sit inside `AuthProvider`. */
export function StatusProvider({ children }: { children: ReactNode }) {
  const { mechanic, refreshMechanic } = useAuth();
  // What was just asked for, shown until the CRM's answer is read back.
  const [requested, setRequested] = useState<'online' | 'offline' | null>(null);

  const stored: MechanicStatus = !mechanic
    ? 'offline'
    : mechanic.status === 'on_job'
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
