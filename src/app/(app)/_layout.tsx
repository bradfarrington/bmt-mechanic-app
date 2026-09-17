import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth';

/** The signed-in area — the tab hubs and everything pushed from them. */
export default function AppLayout() {
  const { session } = useAuth();

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Rises over the tabs like a sheet, from the feed or from a push. */}
      <Stack.Screen
        name="offer/[id]"
        options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }}
      />
      {/* Both open from a push as well as from inside the app. */}
      <Stack.Screen
        name="tomorrow"
        options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }}
      />
      <Stack.Screen
        name="recap"
        options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical' }}
      />
    </Stack>
  );
}
