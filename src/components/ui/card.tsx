import { View, type ViewProps, StyleSheet } from 'react-native';

import { Palette, Radius, Shadows, Spacing, Tones } from '@/constants/theme';

export interface CardProps extends ViewProps {
  /** Set false for cards that lay out their own edge-to-edge content. */
  padded?: boolean;
  /** Blue border + tinted background — the "selected"/"detected" state. */
  selected?: boolean;
  /**
   * `tint` — a pale-blue callout; `danger` — a red-bordered warning; `warn` —
   * an amber callout (`.card.warn` in the mockups).
   */
  tone?: 'default' | 'tint' | 'danger' | 'warn';
  /** Lifted off the page by the float shadow, with no border — "sent" and "done" cards. */
  elevated?: boolean;
}

export function Card({
  padded = true,
  selected = false,
  tone = 'default',
  elevated = false,
  style,
  ...rest
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        tone !== 'default' && styles[tone],
        elevated && styles.elevated,
        selected && styles.selected,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Palette.surfaceCard,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.card,
    ...Shadows.card,
  },
  padded: { padding: Spacing[5] },
  tint: { backgroundColor: Palette.blueTint, borderColor: Palette.blueTintStrong },
  danger: { borderWidth: 1.5, borderColor: Palette.danger },
  warn: { borderWidth: 1.5, borderColor: Palette.warning, backgroundColor: Tones.pending.bg },
  elevated: { borderColor: 'transparent', ...Shadows.float },
  selected: {
    borderWidth: 1.5,
    borderColor: Palette.blue,
    backgroundColor: Palette.blueTint,
  },
});
