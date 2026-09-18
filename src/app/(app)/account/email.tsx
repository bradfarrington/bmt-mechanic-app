import { useRouter } from 'expo-router';
import { AtSign, Info, Lock, MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, IconTile, Input, Notice, Screen, Text } from '@/components/ui';
import { Sizing, Spacing } from '@/constants/theme';
import { requestEmailChange, type EmailChangeField } from '@/lib/account';
import { useAuth } from '@/lib/auth';

/**
 * Change the sign-in email — the customer app's screen against the mechanic
 * route. Two proofs, neither optional: the current password, checked by the
 * CRM before anything is sent, and the confirmation link emailed to the new
 * address, which opens a Book My Tech web page rather than the app.
 */

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = EmailChangeField | 'form';

export default function ChangeEmailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const current = user?.email ?? '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ field: Field; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit() {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_SHAPE.test(trimmed)) {
      setError({ field: 'new_email', message: "That doesn't look like an email address." });
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await requestEmailChange(trimmed, password);
    setSubmitting(false);

    if (!result.ok) {
      setError({ field: result.field ?? 'form', message: result.error });
      return;
    }
    setPassword('');
    setSentTo(result.sentTo);
  }

  if (sentTo) {
    return (
      <Screen title="Change email">
        <Card elevated style={styles.sentCard}>
          <IconTile icon={MailCheck} size="xl" />
          <Text variant="h2">Check your new inbox.</Text>
          <Text color="textSecondary">
            We&rsquo;ve sent a confirmation link to <Text style={styles.strong}>{sentTo}</Text>. Nothing
            has changed yet &mdash; open that link to finish it. We&rsquo;ve let {current} know as well.
          </Text>
          <Text color="textMuted">
            You keep signing in as {current} until then, and the link works on any device.
          </Text>
        </Card>

        <Notice icon={Info} title="After you confirm">
          Sign out and back in with your new address. This phone keeps showing the old one until you do.
        </Notice>

        <View style={styles.spacer} />
        <Button fullWidth size="xl" onPress={() => router.back()}>
          Back to account
        </Button>
      </Screen>
    );
  }

  const canSubmit = email.trim().length > 0 && password.length > 0;

  return (
    <Screen title="Change email" avoidKeyboard>
      <View style={styles.intro}>
        <Text variant="h1">Change your email.</Text>
        <Text color="textSecondary">
          You currently sign in as <Text style={styles.strong}>{current}</Text>. Job and payout emails
          go there too.
        </Text>
      </View>

      <Input
        label="New email"
        iconLeft={AtSign}
        value={email}
        onChangeText={(next) => {
          setEmail(next);
          if (error?.field !== 'password') setError(null);
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={error?.field === 'new_email' ? error.message : undefined}
      />

      <Input
        label="Your password"
        helper="To confirm it's you."
        iconLeft={Lock}
        value={password}
        onChangeText={(next) => {
          setPassword(next);
          if (error?.field !== 'new_email') setError(null);
        }}
        placeholder="Your current password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        error={error?.field === 'password' ? error.message : undefined}
      />

      {error?.field === 'form' && (
        <Card tone="danger" style={styles.errorCard}>
          <Text variant="bodySm" color="danger">
            {error.message}
          </Text>
        </Card>
      )}

      <View style={styles.spacer} />

      <Button fullWidth size="xl" loading={submitting} disabled={!canSubmit} onPress={onSubmit}>
        Send confirmation link
      </Button>

      <Text variant="caption" color="textFaint" style={styles.centre}>
        You keep signing in as {current} until you open the link we send.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  spacer: { flex: 1 },
  centre: { textAlign: 'center' },
  sentCard: { gap: Spacing[3] },
  errorCard: { padding: Sizing.compactPadding },
  strong: { fontWeight: '700' },
});
