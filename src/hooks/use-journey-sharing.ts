import { useEffect, useState } from 'react';

import { startSharing, stopSharing, type Fix, type SharingState } from '@/lib/location';

/**
 * Shares the mechanic's position for as long as `active` holds — the job is
 * `en_route` — and takes it back the moment it does not, or the screen goes.
 *
 * Foreground only: the position updates while the app is open on the job. A
 * mechanic following their sat-nav in another app goes quiet, and the
 * customer's map says so rather than showing a stale pin.
 */
export function useJourneySharing(mechanicId: string | undefined, active: boolean) {
  // Null until `startSharing` has answered — which reads as 'starting' while active.
  const [result, setResult] = useState<Exclude<SharingState, 'off' | 'starting'> | null>(null);
  const [fix, setFix] = useState<Fix | null>(null);

  useEffect(() => {
    if (!mechanicId || !active) return;
    let cancelled = false;

    startSharing(mechanicId, (next) => {
      if (!cancelled) setFix(next);
    }).then((next) => {
      if (!cancelled) setResult(next);
    });

    return () => {
      cancelled = true;
      setResult(null);
      setFix(null);
      void stopSharing(mechanicId);
    };
  }, [mechanicId, active]);

  const state: SharingState = !active ? 'off' : (result ?? 'starting');
  return { state, fix };
}
