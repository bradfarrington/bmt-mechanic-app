import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';

import { fetchOffers, type Offer } from '@/lib/offers';

/**
 * The CRM does not use Supabase Realtime, so offers are polled. Its limit is
 * 40 reads a minute; one every ten seconds leaves room for the refreshes that
 * follow an accept or a decline.
 */
const POLL_MS = 10_000;

export interface OffersState {
  offers: Offer[];
  /** Nothing has been read yet. */
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Live offers while the screen is focused and the app is in the foreground.
 * `enabled` is false when the mechanic is not online — there is nothing to be
 * offered, and no reason to spend the rate limit finding that out.
 */
export function useOffers(enabled: boolean): OffersState {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    const result = await fetchOffers(signal);
    if (signal?.aborted) return;

    if (result.ok) {
      setOffers(result.offers);
      setError(null);
    } else {
      // Keep showing the last good list: one dropped poll is not news.
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      const controller = new AbortController();
      let timer: ReturnType<typeof setInterval> | null = null;

      const start = () => {
        if (timer) return;
        void load(controller.signal);
        timer = setInterval(() => void load(controller.signal), POLL_MS);
      };
      const stop = () => {
        if (timer) clearInterval(timer);
        timer = null;
      };

      if (AppState.currentState === 'active') start();
      const subscription = AppState.addEventListener('change', (state) =>
        state === 'active' ? start() : stop(),
      );

      return () => {
        controller.abort();
        stop();
        subscription.remove();
      };
    }, [enabled, load]),
  );

  const refresh = useCallback(() => load(), [load]);

  return {
    // Going offline empties the list rather than leaving stale offers up.
    offers: enabled ? offers : [],
    loading: enabled && loading,
    error: enabled ? error : null,
    refresh,
  };
}
