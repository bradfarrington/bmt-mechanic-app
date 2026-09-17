import { createContext, useContext, useState, type ReactNode } from 'react';

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
  /** Online ↔ Offline. Does nothing while on a job or locked. */
  toggle: () => void;
  setStatus: (status: MechanicStatus) => void;
}

const StatusContext = createContext<StatusValue | null>(null);

/**
 * Held in memory for the shell. Once the data layer lands this reads the
 * mechanic's availability and active booking from Supabase instead, and
 * `toggle` writes through the CRM.
 */
export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MechanicStatus>('offline');

  function toggle() {
    setStatus((current) =>
      current === 'online' ? 'offline' : current === 'offline' ? 'online' : current,
    );
  }

  return (
    <StatusContext.Provider value={{ status, toggle, setStatus }}>
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus(): StatusValue {
  const value = useContext(StatusContext);
  if (!value) throw new Error('useStatus must be used inside <StatusProvider>');
  return value;
}
