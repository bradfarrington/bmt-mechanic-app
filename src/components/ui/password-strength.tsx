import { View, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { Palette, Sizing, Spacing } from '@/constants/theme';

const SEGMENTS = 4;

/**
 * A rough read on a new password: length, then the mix of lower case, upper
 * case, digits and symbols. Guidance only — it never blocks saving. The
 * screen's minimum and Supabase's own rules decide what is accepted.
 */
function assess(password: string, minLength: number) {
  if (!password) {
    return { filled: 0, colour: Palette.border, label: `At least ${minLength} characters.` };
  }
  if (password.length < minLength) {
    return {
      filled: 1,
      colour: Palette.danger,
      label: `Too short — at least ${minLength} characters.`,
    };
  }

  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter((kind) =>
    kind.test(password),
  ).length;

  let filled = 1;
  if (password.length >= 12) filled += 1;
  if (kinds >= 3) filled += 1;
  if (password.length >= 16 || kinds === 4) filled += 1;
  filled = Math.min(filled, SEGMENTS);

  if (filled === 1) {
    return { filled, colour: Palette.warning, label: 'Easy to guess — try a longer one.' };
  }
  if (filled === 2) return { filled, colour: Palette.warning, label: 'Getting there.' };
  if (filled === 3) return { filled, colour: Palette.success, label: 'Looking strong.' };
  return { filled, colour: Palette.success, label: 'Very strong.' };
}

export interface PasswordStrengthProps {
  password: string;
  minLength: number;
}

export function PasswordStrength({ password, minLength }: PasswordStrengthProps) {
  const { filled, colour, label } = assess(password, minLength);

  return (
    <View style={styles.root}>
      <View style={styles.bars}>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <View
            key={i}
            style={[styles.bar, { backgroundColor: i < filled ? colour : Palette.border }]}
          />
        ))}
      </View>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing[2] },
  bars: { flexDirection: 'row', gap: Spacing[1] },
  bar: {
    flex: 1,
    height: Sizing.strengthBar,
    borderRadius: Sizing.strengthBar / 2,
  },
});
