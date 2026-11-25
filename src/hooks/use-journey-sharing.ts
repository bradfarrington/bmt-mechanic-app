import { useEffect, useRef, useState } from 'react';

import {
  startSharing,
  stopSharing,
  subscribeToFixes,
  type Fix,
  type SharingState,
} from '@/lib/location';

/**
 * Shares the mechanic's position while `active` holds — the job is
 * `en_route` — and takes it back when the job moves on.
 *
 * Leaving the screen does NOT stop it: sharing runs in the background (see
 * `lib/location.ts`) so the customer's map keeps moving while the mechanic
 * drives on their sat-nav. It stops when this screen sees the job leave
 * `en_route`, on sign-out, or when the background task itself finds no job on
 * the way.
 */
export function useJourneySharing(mechanicId: string | undefined, active: boolean) {
  // Null until `startSharing` has answered — which reads as 'starting' while active.
  const [result, setResult] = useState<Exclude<SharingState, 'off' | 'starting'> | null>(null);
  const [fix, setFix] = useState<Fix | null>(null);

  // Only a job this screen saw on the way may be stopped from here. Opening a
  // different, finished job must not end sharing for the one being driven to.
  const wasActive = useRef(false);

  useEffect(() => subscribeToFixes(setFix), []);

  useEffect(() => {
    if (!mechanicId) return;

    if (active) {
      wasActive.current = true;
      let cancelled = false;
      startSharing().then((next) => {
        if (!cancelled) setResult(next);
      });
      return () => {
        cancelled = true;
      };
    }

    if (wasActive.current) {
      wasActive.current = false;
      void stopSharing(mechanicId);
    }
  }, [mechanicId, active]);

  const state: SharingState = !active ? 'off' : (result ?? 'starting');
  return { state, fix: active ? fix : null };
}
