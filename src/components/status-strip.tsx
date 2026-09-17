import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { PulseDot, Text } from '@/components/ui';
import { Sizing, Spacing, StatusStrip as Tokens } from '@/constants/theme';

export type StripTone = keyof typeof Tokens;

export interface StatusStripProps {
  tone: StripTone;
  children: string;
  /** A breathing dot — the job is live. */
  live?: boolean;
}

/** The full-width strip under a job's header. Its colour is the job's state. */
export function StatusStrip({ tone, children, live = false }: StatusStripProps) {
  const look = Tokens[tone];
  const content = (
    <>
      {live ? (
        <PulseDot color={look.fg} />
      ) : (
        <View style={[styles.dot, { backgroundColor: look.fg }]} />
      )}
      <Text variant="bodySm" color={look.fg} style={styles.label} numberOfLines={2}>
        {children}
      </Text>
    </>
  );

  if (typeof look.bg !== 'string') {
    return (
      <LinearGradient
        colors={look.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.strip}
      >
        {content}
      </LinearGradient>
    );
  }
  return <View style={[styles.strip, { backgroundColor: look.bg }]}>{content}</View>;
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
    paddingHorizontal: Sizing.screenPadding,
  },
  dot: { width: Sizing.dot, height: Sizing.dot, borderRadius: Sizing.dot / 2 },
  label: { flex: 1, fontWeight: '600' },
});
