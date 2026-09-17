import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth';

/**
 * First-run setup: payouts, then where, when and what they work on. Step 1 of
 * the five is setting a password, which happens before there is a session.
 *
 * `/payouts` is also where the Locked status button and Today's banner lead
 * later on, so it cannot assume it is inside the wizard — see the screen.
 */
export default function OnboardingLayout() {
  const { session } = useAuth();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
