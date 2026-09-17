import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { acceptOffer, declineOffer } from '@/lib/offers';

export type OfferAnswer = 'accept' | 'decline';

export interface OfferActionsOptions {
  /** After any answer, successful or not — the list is stale either way. */
  onSettled?: () => void;
  /** The offer went to somebody else. Defaults to opening the offer's "gone" screen. */
  onTaken?: (offerId: string) => void;
  /** Accepted, with no arrival window to pick. Defaults to a confirmation alert. */
  onAccepted?: (bookingId: string) => void;
  onDeclined?: () => void;
}

/** Accept and decline, shared by the Today feed and the offer screen. */
export function useOfferActions({
  onSettled,
  onTaken,
  onAccepted,
  onDeclined,
}: OfferActionsOptions = {}) {
  const router = useRouter();
  const [busy, setBusy] = useState<{ offerId: string; answer: OfferAnswer } | null>(null);

  async function accept(offerId: string) {
    if (busy) return;
    setBusy({ offerId, answer: 'accept' });
    const result = await acceptOffer(offerId);
    setBusy(null);
    onSettled?.();

    if (result.ok) {
      // An all-day or flexible job is not finished being accepted until the
      // mechanic has told the customer when they will turn up.
      if (result.needsArrivalWindow) {
        router.replace({ pathname: '/jobs/[id]/arrival-window', params: { id: result.bookingId } });
      } else if (onAccepted) {
        onAccepted(result.bookingId);
      } else {
        Alert.alert('Job accepted', 'It’s in your schedule. The customer has been told.');
      }
      return;
    }

    if (result.taken || result.gone) {
      if (onTaken) onTaken(offerId);
      else router.push({ pathname: '/offer/[id]', params: { id: offerId, taken: '1' } });
      return;
    }
    Alert.alert('Couldn’t accept that', result.error);
  }

  async function decline(offerId: string) {
    if (busy) return;
    setBusy({ offerId, answer: 'decline' });
    const result = await declineOffer(offerId);
    setBusy(null);
    onSettled?.();

    // Already answered or gone is the outcome they wanted anyway.
    if (result.ok || result.taken || result.gone) onDeclined?.();
    else Alert.alert('Couldn’t decline that', result.error);
  }

  return {
    accept,
    decline,
    busyFor: (offerId: string) => (busy?.offerId === offerId ? busy.answer : null),
    busy: busy !== null,
  };
}
