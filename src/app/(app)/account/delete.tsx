import { useRouter } from 'expo-router';
import { Banknote, FileClock, Lock, Trash2, TriangleAlert, UserX, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, IconTile, Input, Notice, Overline, Screen, Text } from '@/components/ui';
import { Palette, Sizing, Spacing, type Tone } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

/**
 * Delete the account — App Store guideline 5.1.1(v). The customer app's
 * screen against the mechanic route. Three gates before anything is sent:
 * the current password (checked by signing in with it), a second in-place
 * confirmation, and the CRM's own refusals — a live job, an open dispute or
 * case, money owed either way — which come back as a sentence.
 *
 * On success there is nothing to navigate to: `deleteAccount` signs this
 * device out, `(app)/_layout` redirects to the login screen, and that screen
 * reads `accountDeleted` to say what happened.
 */

type Phase = 'idle' | 'confirm' | 'submitting';

/** What the CRM's mechanic deletion does — see `docs/account-crm-prompt.md` §6. */
const CONSEQUENCES: readonly { icon: LucideIcon; tone: Tone; title: string; body: string }[] = [
  {
    icon: UserX,
    tone: 'error',
    title: 'Your sign-in is removed',
    body: 'Straight away, on this phone and every other, along with your name, photo and documents.',
  },
  {
    icon: FileClock,
    tone: 'pending',
    title: 'Job records are kept',
    body: 'Completed jobs, payouts and reviews stay as records, no longer linked to a login.',
  },
  {
    icon: Banknote,
    tone: 'error',
    title: 'Money must be settled first',
    body: 'Anything Book My Tech owes you, or you owe it, has to be paid before we can delete.',
  },
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { verifyPassword, deleteAccount } = useAuth();

  const [password, setPassword] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);

  async function onConfirm() {
    setPhase('submitting');
    setFieldError(null);
    setRefusal(null);

    const check = await verifyPassword(password);
    if (check.error) {
      setFieldError(check.error);
      setPhase('idle');
      return;
    }

    const result = await deleteAccount();
    if (result.error) {
      setRefusal(result.error);
      setPhase('idle');
    }
  }

  const footer =
    phase === 'idle' ? (
      <View style={styles.footer}>
        <Button
          fullWidth
          size="xl"
          variant="destructive"
          iconLeft={Trash2}
          disabled={password.length === 0}
          onPress={() => setPhase('confirm')}
        >
          Delete my account
        </Button>
        {router.canGoBack() && (
          <Button fullWidth variant="ghost" onPress={() => router.back()}>
            Keep my account
          </Button>
        )}
      </View>
    ) : (
      <View style={styles.footer}>
        <View style={styles.lastCheck}>
          <Text style={[styles.strong, styles.centre]}>Last check &mdash; delete it?</Text>
          <Text variant="caption" color="textSecondary" style={styles.centre}>
            There&rsquo;s no undo. You stop receiving offers the moment you tap.
          </Text>
        </View>
        <Button
          fullWidth
          size="xl"
          variant="destructive"
          iconLeft={Trash2}
          loading={phase === 'submitting'}
          onPress={() => void onConfirm()}
        >
          Yes, delete my account
        </Button>
        <Button fullWidth variant="ghost" disabled={phase === 'submitting'} onPress={() => setPhase('idle')}>
          Keep my account
        </Button>
      </View>
    );

  return (
    <Screen title="Delete account" avoidKeyboard footer={footer}>
      <View style={styles.intro}>
        <Text variant="h1">Delete your account?</Text>
        <Text color="textSecondary">
          This removes your sign-in and your details from Book My Tech. It can&rsquo;t be undone.
        </Text>
      </View>

      <View style={styles.section}>
        <Overline>What happens</Overline>
        <Card padded={false}>
          {CONSEQUENCES.map((item, index) => (
            <View key={item.title} style={[styles.row, index > 0 && styles.divided]}>
              <IconTile icon={item.icon} tone={item.tone} size="sm" />
              <View style={styles.rowText}>
                <Text style={styles.strong}>{item.title}</Text>
                <Text variant="caption" color="textMuted">
                  {item.body}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </View>

      <Notice icon={TriangleAlert} tone="warn" title="Got a job on the go?">
        Live jobs, open disputes and open cases need to be finished before we can delete.
      </Notice>

      <Input
        label="Your password"
        iconLeft={Lock}
        value={password}
        onChangeText={(next) => {
          setPassword(next);
          setFieldError(null);
        }}
        placeholder="To confirm it's you"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        editable={phase !== 'submitting'}
        error={fieldError ?? undefined}
      />

      {!!refusal && (
        <Notice icon={TriangleAlert} tone="danger" title="Your account wasn't deleted">
          {refusal}
        </Notice>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  section: { gap: Spacing[2] },
  centre: { textAlign: 'center' },
  strong: { fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Sizing.compactPadding,
  },
  divided: { borderTopWidth: 1, borderTopColor: Palette.borderSubtle },
  rowText: { flex: 1, gap: Spacing[1] },
  footer: { gap: Spacing[2] },
  lastCheck: { gap: Spacing[1], paddingBottom: Spacing[1] },
});
