import { useRouter } from 'expo-router';
import { Mail, MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { Button, Card, IconTile, Input, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

/**
 * Step one of two: ask for the address, send the link. Step two is
 * `/reset-password`, which the link itself opens.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);

    const { error: resetError } = await sendPasswordReset(email);
    setSubmitting(false);

    // Only a failed *request* lands here — an address with no account still
    // resolves cleanly, so this never doubles as an account-existence check.
    if (resetError) {
      setError(resetError);
      return;
    }
    setSent(true);
  }

  // Back to the sign-in screen this was opened from, rather than a second copy
  // of it stacked on top.
  const backToSignIn = () => router.dismissTo('/login');

  if (sent) {
    return (
      <Screen title="Reset password" back={false}>
        <Card elevated style={styles.sentCard}>
          <IconTile icon={MailCheck} size="xl" />
          <Text variant="h2">Check your email.</Text>
          <Text color="textSecondary">
            If there&rsquo;s an account for{' '}
            <Text style={styles.strong}>{email.trim()}</Text>, we&rsquo;ve sent
            a link to set a new password. It opens straight back into the app.
          </Text>
          <Text color="textMuted">
            Nothing after a minute or two? Check your spam folder, and that the
            address above is the one you signed up with.
          </Text>
        </Card>

        <View style={styles.spacer} />

        <Button fullWidth size="xl" onPress={backToSignIn}>
          Back to sign in
        </Button>

        <Button
          fullWidth
          variant="ghost"
          onPress={() => {
            setSent(false);
            setError(null);
          }}
        >
          Use a different email
        </Button>
      </Screen>
    );
  }

  return (
    <Screen title="Reset password" avoidKeyboard>
      <View style={styles.intro}>
        <Text variant="h1">Forgotten your password?</Text>
        <Text color="textSecondary">
          Pop your email in and we&rsquo;ll send you a link to set a new one.
        </Text>
      </View>

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
        error={error ?? undefined}
      />

      <View style={styles.spacer} />

      <Button
        fullWidth
        size="xl"
        loading={submitting}
        disabled={!email.trim().includes('@')}
        onPress={onSubmit}
      >
        Send reset link
      </Button>

      <View style={styles.footer}>
        <Text variant="caption" color="textMuted">
          Remembered it?{' '}
        </Text>
        <Text
          variant="caption"
          color="blue"
          style={styles.link}
          onPress={backToSignIn}
          accessibilityRole="link"
        >
          Back to sign in
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  spacer: { flex: 1 },
  sentCard: { gap: Spacing[3] },
  strong: { fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: { fontWeight: '600' },
});
