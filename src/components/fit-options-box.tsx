import { TriangleAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { Palette, Radius, Spacing, Tones, type PaletteColor } from '@/constants/theme';
import {
  fitOptionsHeading,
  fitOptionsUnsure,
  isChargedOption,
  type FitOptions,
} from '@/lib/fit-options';

/**
 * NAPA lists this part in versions for cars with and without air-con (or
 * stop-start): which one the car takes, and what the customer said. Amber
 * while the car's equipment is unknown, since the mechanic must check before
 * buying. Mirrors `FitOptionsBox` on the CRM's mechanic job page.
 */
export function FitOptionsBox({ fit, charged }: { fit: FitOptions; charged?: string | null }) {
  const unsure = fitOptionsUnsure(fit);
  const ink: PaletteColor = unsure ? 'warningText' : 'textSecondary';

  return (
    <View style={[styles.box, unsure ? styles.unsure : styles.known]}>
      <View style={styles.heading}>
        <Icon icon={TriangleAlert} size={13} color={Palette[ink]} style={styles.icon} />
        <Text variant="caption" color={ink} style={[styles.grow, styles.strong]}>
          {fitOptionsHeading(fit)}
        </Text>
      </View>
      <View style={styles.options}>
        {fit.options.map((option) => (
          <Text key={`${option.partNumber}:${option.label}`} variant="caption" color={ink}>
            <Text variant="caption" color={ink} style={styles.medium}>
              {option.label}:
            </Text>{' '}
            {option.brand ?? 'NAPA Auto Parts'}{' '}
            <Text variant="monoSm" color={ink}>
              {option.partNumber}
            </Text>
            {isChargedOption(option, charged) && (
              <Text variant="caption" color="textMuted">
                {' '}
                (priced as)
              </Text>
            )}
          </Text>
        ))}
      </View>
      {unsure && (
        <Text variant="caption" color={ink}>
          Ask the customer in the chat, or check on arrival.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: Spacing[1],
    gap: Spacing[1],
    borderWidth: 1,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  unsure: { borderColor: Palette.warning, backgroundColor: Tones.pending.bg },
  known: { borderColor: Palette.border, backgroundColor: Palette.surface },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[1] },
  icon: { marginTop: Spacing[1] / 2 },
  grow: { flex: 1 },
  strong: { fontWeight: '700' },
  medium: { fontWeight: '600' },
  options: { gap: Spacing[1] / 2 },
});
