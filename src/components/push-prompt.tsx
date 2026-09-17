import { Bell } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { Button, Card, IconTile, Text } from '@/components/ui';
import { OnDark, Sizing, Spacing } from '@/constants/theme';
import { getPushPermission, registerForPush } from '@/lib/push';

/**
 * "Not now" is remembered for the session only — the card comes back next
 * launch. A permanent dismissal would need storage, and a mechanic who said
 * not-now during setup is exactly the one to ask again once they have watched
 * an offer go to somebody quicker.
 */
let dismissedThisSession = false;

export interface PushPromptProps {
  reason: string;
  /** A glass card for the deep gradient — "You're all set." */
  onDark?: boolean;
}

/**
 * The in-context ask for notification permission.
 *
 * Rendered where the mechanic has a reason to want them — the end of setup and
 * Today — and nowhere else. iOS allows the
 * system prompt exactly once, so it is not spent on first launch.
 *
 * Renders nothing when the answer is already known (granted or denied), on a
 * simulator, or on a build with no EAS project id — every one of those is a
 * state where a prompt could only disappoint.
 */
export function PushPrompt({ reason, onDark = false }: PushPromptProps) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (dismissedThisSession) return;
    let active = true;
    getPushPermission().then((permission) => {
      if (active && permission === 'undetermined') setVisible(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!visible) return null;

  async function enable() {
    setBusy(true);
    await registerForPush();
    // Whatever they chose, the system has their answer now and will not ask
    // again — so neither does this card.
    setBusy(false);
    setVisible(false);
  }

  function dismiss() {
    dismissedThisSession = true;
    setVisible(false);
  }

  return (
    <Card style={[styles.card, onDark && styles.cardOnDark]}>
      <View style={styles.row}>
        <IconTile icon={Bell} tone={onDark ? 'onDark' : 'accent'} />
        <View style={styles.text}>
          <Text color={onDark ? 'textInverse' : 'textPrimary'} style={styles.title}>
            Don’t miss an offer
          </Text>
          <Text variant="caption" color={onDark ? OnDark.textSecondary : 'textSecondary'}>
            {reason}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          size="sm"
          variant={onDark ? 'onDark' : 'primary'}
          loading={busy}
          onPress={() => void enable()}
        >
          Turn on notifications
        </Button>
        {/* A ghost button's slate label disappears on the gradient, so the
            dark card dismisses with a plain white link instead. */}
        {onDark ? (
          <Text
            variant="bodySm"
            color={OnDark.link}
            style={styles.notNow}
            onPress={busy ? undefined : dismiss}
            accessibilityRole="button"
          >
            Not now
          </Text>
        ) : (
          <Button size="sm" variant="ghost" disabled={busy} onPress={dismiss}>
            Not now
          </Button>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing[3], padding: Sizing.compactPadding },
  cardOnDark: {
    backgroundColor: OnDark.tile,
    borderColor: OnDark.fill,
    shadowOpacity: 0,
    elevation: 0,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  text: { flex: 1, gap: Spacing[1] },
  title: { fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  notNow: { fontWeight: '600', paddingHorizontal: Spacing[2] },
});
