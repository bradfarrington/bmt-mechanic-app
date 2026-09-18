import { Stack } from 'expo-router';

import { ApplicationDraftProvider } from '@/lib/application-draft';

/**
 * Applying to join. Inside `(auth)`, so it is only reachable signed out — the
 * applicant has no account until Book My Tech approves them.
 */
export default function ApplyLayout() {
  return (
    <ApplicationDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ApplicationDraftProvider>
  );
}
