import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Lock, Mail, ShieldAlert, Wrench } from 'lucide-react-native';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { Button, IconTile, Input, Notice, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { Env } from '@/lib/env';

export default function LoginScreen() {
  const { signIn, notMechanic } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);
    // On success the auth listener flips the session and `(auth)/_layout`
    // redirects to the entry router, which picks setup or Today.
    if (signInError) setError(signInError);
    setSubmitting(false);
  }

  const canSubmit = email.trim().length > 0 && password.length > 0;

  return (
    <Screen title="Sign in" avoidKeyboard>
      <View style={styles.intro}>
        <IconTile icon={Wrench} tone="brand" size="xl" style={styles.mark} />
        <Text variant="h1">Welcome back.</Text>
        <Text color="textSecondary">
          Your jobs, your schedule, your earnings — all in one place.
        </Text>
      </View>

      {/* A session restored from storage that turned out not to be a mechanic's. */}
      {notMechanic && !error && (
        <Notice icon={ShieldAlert} tone="danger" title="Wrong app for this account">
          This app is for Book My Tech mechanics. If you&rsquo;re a customer, use the Book My
          Tech app instead.
        </Notice>
      )}

      <Input
        label="Email"
        iconLeft={Mail}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />

      <Input
        label="Password"
        labelAction={
          <Link href="/forgot-password">
            <Text variant="caption" color="blue" style={styles.link}>
              Forgot password?
            </Text>
          </Link>
        }
        iconLeft={Lock}
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        error={error ?? undefined}
      />

      <View style={styles.spacer} />

      <Button
        fullWidth
        size="xl"
        loading={submitting}
        disabled={!canSubmit}
        onPress={onSubmit}
      >
        Sign in
      </Button>

      <View style={styles.footer}>
        <Text variant="caption" color="textMuted">
          Not a mechanic yet?{' '}
        </Text>
        {/* Applications are a long web form with document uploads — not in the app. */}
        <Text
          variant="caption"
          color="blue"
          style={styles.link}
          accessibilityRole="link"
          onPress={() => WebBrowser.openBrowserAsync(`${Env.apiBaseUrl}/mechanics/apply`)}
        >
          Apply to join
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  mark: { marginBottom: Spacing[3] },
  spacer: { flex: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: { fontWeight: '600' },
});
