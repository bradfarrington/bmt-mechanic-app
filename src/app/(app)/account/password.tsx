import { useRouter } from 'expo-router';
import { CircleCheck, Info, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, IconTile, Input, Notice, PasswordStrength, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

/**
 * Change the password from inside the app — the customer app's screen. The
 * current one is asked for and checked first: `verifyPassword` signs in with
 * it, which is also what satisfies Supabase's "secure password change" rule
 * without an emailed code. Other devices stay signed in.
 */

/** The same minimum `set-password.tsx` enforces. */
const MIN_PASSWORD_LENGTH = 8;

type Field = 'current' | 'next' | 'confirmation';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { verifyPassword, updatePassword } = useAuth();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<{ field: Field; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    if (next !== confirmation) {
      setError({ field: 'confirmation', message: "Those don't match." });
      return;
    }
    if (next === current) {
      setError({ field: 'next', message: 'Your new password needs to be different from the current one.' });
      return;
    }

    setSubmitting(true);
    setError(null);

    const check = await verifyPassword(current);
    if (check.error) {
      setError({ field: 'current', message: check.error });
      setSubmitting(false);
      return;
    }

    const result = await updatePassword(next);
    setSubmitting(false);
    if (result.error) {
      setError({ field: 'next', message: result.error });
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <Screen title="Change password">
        <Card elevated style={styles.resultCard}>
          <IconTile icon={CircleCheck} tone="success" size="xl" />
          <Text variant="h2">That&rsquo;s done.</Text>
          <Text color="textSecondary">
            Use the new password next time you sign in. You&rsquo;re still signed in on this phone.
          </Text>
        </Card>
        <View style={styles.spacer} />
        <Button fullWidth size="xl" onPress={() => router.back()}>
          Back to account
        </Button>
      </Screen>
    );
  }

  const longEnough = next.length >= MIN_PASSWORD_LENGTH;
  const canSubmit = current.length > 0 && longEnough && confirmation.length > 0;

  return (
    <Screen title="Change password" avoidKeyboard>
      <View style={styles.intro}>
        <Text variant="h1">Change your password.</Text>
        <Text color="textSecondary">You&rsquo;ll still be signed in on this phone.</Text>
      </View>

      <Input
        label="Current password"
        iconLeft={Lock}
        value={current}
        onChangeText={(value) => {
          setCurrent(value);
          if (error?.field === 'current') setError(null);
        }}
        placeholder="Your current password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        error={error?.field === 'current' ? error.message : undefined}
      />

      <View style={styles.field}>
        <Input
          label="New password"
          iconLeft={Lock}
          value={next}
          onChangeText={(value) => {
            setNext(value);
            if (error?.field === 'next') setError(null);
          }}
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          error={error?.field === 'next' ? error.message : undefined}
        />
        <PasswordStrength password={next} minLength={MIN_PASSWORD_LENGTH} />
      </View>

      <Input
        label="Confirm new password"
        iconLeft={Lock}
        value={confirmation}
        onChangeText={(value) => {
          setConfirmation(value);
          if (error?.field === 'confirmation') setError(null);
        }}
        placeholder="Type it again"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        error={error?.field === 'confirmation' ? error.message : undefined}
      />

      <Notice icon={Info} title="Forgotten your current one?">
        Sign out and use &ldquo;Forgotten your password?&rdquo; on sign-in &mdash; we&rsquo;ll email
        you a reset link instead.
      </Notice>

      <View style={styles.spacer} />

      <Button fullWidth size="xl" loading={submitting} disabled={!canSubmit} onPress={onSubmit}>
        Change password
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  field: { gap: Spacing[2] },
  resultCard: { gap: Spacing[3] },
  spacer: { flex: 1 },
});
