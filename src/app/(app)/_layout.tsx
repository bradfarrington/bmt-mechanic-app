import { Stack } from 'expo-router';

/**
 * The signed-in area — the tab hubs and everything pushed from them. The
 * session check lands here with the auth stack.
 */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
