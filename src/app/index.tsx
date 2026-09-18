import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { loadWorkingWeek } from '@/lib/mechanic';
import { useWelcomeSeen } from '@/lib/welcome';

/**
 * Entry router. No session goes to sign-in — or, on this device's first
 * launch, to the welcome carousel, which ends at applying or signing in; a mechanic who has never saved
 * their working hours goes through first-run setup; everyone else lands on
 * Today.
 *
 * The CRM keeps no "has onboarded" flag, so saved hours stand in for one: the
 * wizard always writes them, and a mechanic who set them on the web has no
 * need of the wizard either.
 *
 * The root layout holds the splash until the session and the mechanic record
 * are restored, so both are settled by the time this renders.
 */
export default function Index() {
  const { session, mechanic } = useAuth();
  const welcomeSeen = useWelcomeSeen();
  const mechanicId = mechanic?.id;
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    if (!mechanicId) return;
    let active = true;

    loadWorkingWeek(mechanicId).then((result) => {
      // Unreadable is not "never set up" — don't march a working mechanic
      // back through the wizard because the network dropped.
      if (active) setConfigured(result.ok ? result.configured : true);
    });

    return () => {
      active = false;
    };
  }, [mechanicId]);

  if (!session) return <Redirect href={welcomeSeen ? '/login' : '/welcome'} />;
  // Signed in but the record could not be read: Today can say so.
  if (!mechanic) return <Redirect href="/today" />;

  if (configured === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Palette.blue} />
      </View>
    );
  }

  if (configured) return <Redirect href="/today" />;
  return <Redirect href={mechanic.stripe_payouts_enabled ? '/service-area' : '/payouts'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
  },
});
