import { Caveat_500Medium, Caveat_700Bold } from '@expo-google-fonts/caveat';
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
import { StatusProvider } from '@/lib/status';

// Hold the splash until the fonts are registered, so headings never jump from
// the system font to Inter Tight a beat after they appear.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
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
    Caveat_500Medium,
    Caveat_700Bold,
  });
  // A font that fails to load falls back to the system face — better than a
  // splash screen that never lifts.
  const ready = fontsLoaded || fontError != null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

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
      {/* Above the navigator: the tab bar and the job screens both read it. */}
      <StatusProvider>
        <RootNavigator />
      </StatusProvider>
    </SafeAreaProvider>
  );
}
