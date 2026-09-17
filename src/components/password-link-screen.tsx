import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ArrowRight, CircleCheck, Link2Off, Lock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import {
  Button,
  Card,
  IconTile,
  Input,
  Notice,
  PasswordStrength,
  Screen,
  Text,
} from '@/components/ui';
import { Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/** The CRM's set-password page enforces the same minimum. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * The screen an emailed link opens — step two of a reset (`/reset-password`),
 * or a newly approved mechanic's first password (`/set-password`). Both are
 * Supabase recovery links; only the wording differs.
 *
 * Both routes sit deliberately **outside** the `(auth)` group. A recovery link establishes a
 * real session, and `(auth)/_layout` redirects any session into the app —
 * so this screen would be unreachable from in there. It is outside `(app)` too,
 * because the link can arrive before the session exists and that group's gate
 * would bounce it to sign-in mid-exchange.
 *
 * ## Why the URL is read rather than the route params
 *
 * Supabase hands the credential back in one of three shapes depending on the
 * project's flow and how the link was built, and only one of them is a query
 * param Expo Router would surface:
 *
 * - `?code=…` — PKCE. Exchanged for a session.
 * - `#access_token=…&refresh_token=…` — implicit. A **fragment**, which routers
 *   do not parse, so this is the case that forces reading the raw URL.
 * - `?token_hash=…&type=recovery` — the verify-link shape.
 *
 * All three are handled: which one arrives is a property of the Supabase
 * project's configuration, not of this app, and a reset that silently fails
 * because the shape changed would be near-impossible to diagnose from a bug
 * report.
 */

type Phase =
  /** Reading the link, establishing the recovery session. */
  | { kind: 'verifying' }
  /** Session is live — collect the new password. */
  | { kind: 'ready' }
  /** Link was bad, expired, or already used. */
  | { kind: 'invalid'; message: string }
  | { kind: 'done' };

const COPY = {
  reset: {
    title: 'Reset password',
    heading: 'Set a new password.',
    body: `Use at least ${MIN_PASSWORD_LENGTH} characters. Something memorable but not the last one.`,
    confirmLabel: 'Confirm new password',
    submit: 'Save new password',
    doneTitle: 'Password updated',
    doneBody:
      'You’re signed in on this device and can use the new password next time.',
    doneCta: 'Go to my jobs',
  },
  welcome: {
    title: 'Welcome to BMT',
    heading: 'Set your password.',
    body: `Use at least ${MIN_PASSWORD_LENGTH} characters. This is what you’ll sign in with from now on.`,
    confirmLabel: 'Confirm password',
    submit: 'Save and continue',
    doneTitle: 'Welcome to BMT',
    doneBody: 'Your password is set. A few quick questions and you’re ready for work.',
    doneCta: 'Continue',
  },
} as const;

export interface PasswordLinkScreenProps {
  /** `welcome` is a mechanic's first password, from the approval email. */
  variant: keyof typeof COPY;
}

const EXPIRED_MESSAGE =
  'That link has expired or has already been used. Reset links are ' +
  'single-use and last one hour — request a new one and it will work.';

/** Everything after `#`, parsed the same way a query string would be. */
function fragmentParams(url: string) {
  const hash = url.split('#')[1];
  return new URLSearchParams(hash ?? '');
}

export function PasswordLinkScreen({ variant }: PasswordLinkScreenProps) {
  const copy = COPY[variant];
  const router = useRouter();
  const { updatePassword } = useAuth();

  // The URL that opened the app. A hook rather than a one-off read, because on
  // a cold start the link can arrive a tick after this screen first renders.
  const url = Linking.useURL();

  const [phase, setPhase] = useState<Phase>({ kind: 'verifying' });
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!url) return;
    let active = true;

    const settle = (next: Phase) => {
      if (active) setPhase(next);
    };

    (async () => {
      const parsed = Linking.parse(url);
      const query = parsed.queryParams ?? {};
      const fragment = fragmentParams(url);

      const single = (value: unknown) =>
        typeof value === 'string' ? value : undefined;

      // Supabase reports a refused link in the URL itself rather than by
      // failing an exchange, so this has to be read before anything else is
      // attempted — otherwise it surfaces as a confusing "auth session missing".
      const refusal =
        single(query.error_description) ??
        fragment.get('error_description') ??
        single(query.error) ??
        fragment.get('error');
      if (refusal) {
        settle({ kind: 'invalid', message: EXPIRED_MESSAGE });
        return;
      }

      const code = single(query.code);
      const accessToken = fragment.get('access_token');
      const refreshToken = fragment.get('refresh_token');
      const tokenHash = single(query.token_hash) ?? fragment.get('token_hash');

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        settle(
          exchangeError
            ? { kind: 'invalid', message: EXPIRED_MESSAGE }
            : { kind: 'ready' },
        );
        return;
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        settle(
          sessionError
            ? { kind: 'invalid', message: EXPIRED_MESSAGE }
            : { kind: 'ready' },
        );
        return;
      }

      if (tokenHash) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: tokenHash,
        });
        settle(
          otpError
            ? { kind: 'invalid', message: EXPIRED_MESSAGE }
            : { kind: 'ready' },
        );
        return;
      }

      // No credential in the URL at all — someone reached this route directly
      // rather than through a link.
      settle({
        kind: 'invalid',
        message:
          "This screen opens from the link in a password reset email. Request " +
          'one from the sign-in screen.',
      });
    })();

    return () => {
      active = false;
    };
  }, [url]);

  async function onSubmit() {
    if (password !== confirmation) {
      setError("Those don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: updateError } = await updatePassword(password);
    setSubmitting(false);

    if (updateError) {
      setError(updateError);
      return;
    }
    setPhase({ kind: 'done' });
  }

  if (phase.kind === 'verifying') {
    return (
      <Screen title={copy.title} back={false}>
        <View style={styles.centre}>
          <ActivityIndicator color={Palette.blue} />
          <Text variant="bodySm" color="textMuted">
            Checking your link…
          </Text>
        </View>
      </Screen>
    );
  }

  if (phase.kind === 'invalid') {
    return (
      <Screen title={copy.title} back={false}>
        <Card elevated style={styles.resultCard}>
          <IconTile icon={Link2Off} tone="error" size="xl" />
          <Text variant="h2">That link didn&rsquo;t work.</Text>
          <Text color="textSecondary">{phase.message}</Text>
        </Card>
        <View style={styles.spacer} />
        <Button
          fullWidth
          size="xl"
          onPress={() => router.replace('/forgot-password')}
        >
          Request a new link
        </Button>
        <Button
          fullWidth
          variant="ghost"
          onPress={() => router.replace('/login')}
        >
          Back to sign in
        </Button>
      </Screen>
    );
  }

  if (phase.kind === 'done') {
    return (
      <Screen title={copy.doneTitle} back={false}>
        <Card elevated style={styles.resultCard}>
          <IconTile icon={CircleCheck} tone="success" size="xl" />
          <Text variant="h2">That&rsquo;s done.</Text>
          <Text color="textSecondary">{copy.doneBody}</Text>
        </Card>
        <View style={styles.spacer} />
        <Button
          fullWidth
          size="xl"
          iconRight={ArrowRight}
          onPress={() => router.replace('/')}
        >
          {copy.doneCta}
        </Button>
      </Screen>
    );
  }

  const longEnough = password.length >= MIN_PASSWORD_LENGTH;

  return (
    <Screen title={copy.title} back={false} avoidKeyboard>
      {variant === 'welcome' && (
        <Notice icon={CircleCheck} tone="success" title="Your application’s approved.">
          Set a password to get into your dashboard.
        </Notice>
      )}

      <View style={styles.intro}>
        <Text variant="h1">{copy.heading}</Text>
        <Text color="textSecondary">{copy.body}</Text>
      </View>

      <View style={styles.field}>
        <Input
          label="New password"
          iconLeft={Lock}
          value={password}
          onChangeText={setPassword}
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <PasswordStrength password={password} minLength={MIN_PASSWORD_LENGTH} />
      </View>

      <Input
        label={copy.confirmLabel}
        iconLeft={Lock}
        value={confirmation}
        onChangeText={setConfirmation}
        placeholder="Type it again"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        error={error ?? undefined}
      />

      <View style={styles.spacer} />

      <Button
        fullWidth
        size="xl"
        loading={submitting}
        disabled={!longEnough || !confirmation}
        iconRight={variant === 'welcome' ? ArrowRight : undefined}
        onPress={onSubmit}
      >
        {copy.submit}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  field: { gap: Spacing[2] },
  resultCard: { gap: Spacing[3] },
  spacer: { flex: 1 },
  centre: { alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[6] },
});
