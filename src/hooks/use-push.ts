import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';

import { linkFromResponse, getPushPermission, registerForPush } from '@/lib/push';

/**
 * A tapped notification opens what it is about — an offer, tomorrow's running
 * order, or the end-of-day recap.
 *
 * Two paths, because the listener does not fire when the tap is what launched
 * the app: `getLastNotificationResponseAsync` covers the cold start, the
 * listener covers a tap while the app is running or backgrounded. The cold
 * start one is checked once — re-running it on every remount would re-open
 * the same offer each time the navigator re-rendered.
 *
 * `(app)/_layout` redirects to the login screen if there is no session, so a
 * signed-out tap lands on sign-in rather than an empty offer.
 */
export function usePushDeepLinks() {
  const router = useRouter();
  const handledColdStart = useRef(false);

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null | undefined) => {
      const link = linkFromResponse(response);
      if (!link) return;

      if (link.type === 'offer') {
        router.push({ pathname: '/offer/[id]', params: { id: link.offerId } });
      } else if (link.type === 'message') {
        router.push({ pathname: '/jobs/[id]/messages', params: { id: link.bookingId } });
      } else {
        router.push({ pathname: `/${link.type}`, params: link.day ? { day: link.day } : {} });
      }
    };

    if (!handledColdStart.current) {
      handledColdStart.current = true;
      Notifications.getLastNotificationResponseAsync().then(open);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [router]);
}

/**
 * Keep the CRM's copy of this device's token current.
 *
 * Only when permission is **already** granted — this never prompts. The
 * in-context prompt lives in `PushPrompt`; this just makes sure a token that
 * Expo has rotated, or a mechanic who signed in on a new phone, ends up on
 * file without them having to find the toggle again.
 */
export function usePushRegistration(session: Session | null) {
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let active = true;

    getPushPermission().then((permission) => {
      if (active && permission === 'granted') void registerForPush();
    });

    return () => {
      active = false;
    };
  }, [userId]);
}
