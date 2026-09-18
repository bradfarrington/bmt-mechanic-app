import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  InterTight_600SemiBold,
  InterTight_700Bold,
  InterTight_800ExtraBold,
  InterTight_900Black,
} from '@expo-google-fonts/inter-tight';
import {
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';
import { usePushDeepLinks, usePushRegistration } from '@/hooks/use-push';
import { AuthProvider, useAuth } from '@/lib/auth';
import { InboxProvider } from '@/lib/inbox-state';
import { StatusProvider } from '@/lib/status';
import { loadWelcomeSeen, useWelcomeSeen } from '@/lib/welcome';

// Hold the splash until the persisted session and its mechanic record are
// restored, the fonts are registered and we know whether to show the welcome,
// so the app never flashes a signed-out frame, headings that jump from the
// system font to Inter Tight a beat after they appear, or sign-in before the
// welcome replaces it.
SplashScreen.preventAutoHideAsync();
loadWelcomeSeen();

function RootNavigator() {
  const { initialising, session } = useAuth();
  const welcomeSeen = useWelcomeSeen();

  // Registered under the face names `fontFace` in `constants/theme.ts` hands out.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    InterTight_600SemiBold,
    InterTight_700Bold,
    InterTight_800ExtraBold,
    InterTight_900Black,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });
  // A font that fails to load falls back to the system face — better than a
  // splash screen that never lifts.
  const fontsReady = fontsLoaded || fontError != null;
  const ready = !initialising && fontsReady && welcomeSeen !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // A tapped notification opens its offer; a signed-in device keeps its token
  // on file with the CRM. Neither prompts — see `components/push-prompt`.
  usePushDeepLinks();
  usePushRegistration(session);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        // Every screen draws its own header via `components/ui/screen.tsx`.
        headerShown: false,
        contentStyle: { backgroundColor: Palette.surface },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* Light-only app — the header bar is white, so dark content. */}
      <StatusBar style="dark" />
      <AuthProvider>
        {/* Above the navigator: the tab bar and the job screens both read it. */}
        <StatusProvider>
          {/* Shared by the Inbox tab and the tab bar's unread dot. */}
          <InboxProvider>
            <RootNavigator />
          </InboxProvider>
        </StatusProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
