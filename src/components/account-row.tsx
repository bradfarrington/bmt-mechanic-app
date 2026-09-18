import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, IconTile, Text } from '@/components/ui';
import { Palette, Sizing, Spacing, type Tone } from '@/constants/theme';

export interface AccountRowProps {
  icon: LucideIcon;
  /** The tile's colour pair — `accent` by default; `pending` for a warning, `success` for money. */
  tone?: Tone;
  title: string;
  subtitle?: string | null;
  /** A pill beside the title — "1 expiring", "Approved". */
  badge?: ReactNode;
  /** A rule above the row, when it follows another in the same card. */
  divided?: boolean;
  /** With a handler the row is a button with a chevron; without, it is a plain line. */
  onPress?: () => void;
  /** Replaces the chevron — a status pill on a document row. */
  trailing?: ReactNode;
  accessibilityLabel?: string;
}

/**
 * One line of a settings list: the mockup's `.list-row`. Used by the Account
 * tab, Documents, Go Pro and the Help centre — copied from the customer app's
 * `SettingsRow` and given a badge and a trailing slot.
 */
export function AccountRow({
  icon,
  tone = 'accent',
  title,
  subtitle,
  badge,
  divided = false,
  onPress,
  trailing,
  accessibilityLabel,
}: AccountRowProps) {
  const body = (
    <>
      <IconTile icon={icon} tone={tone} />
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text variant="bodySm" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {badge}
        </View>
        {!!subtitle && (
          <Text variant="caption" color="textMuted" numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing ??
        (onPress ? (
          <Icon icon={ChevronRight} size={Sizing.rowChevron} strokeWidth={2} color={Palette.textMuted} />
        ) : null)}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, divided && styles.divided]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title)}
      style={({ pressed }) => [styles.row, divided && styles.divided, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Sizing.compactPadding,
  },
  divided: { borderTopWidth: 1, borderTopColor: Palette.borderSubtle },
  pressed: { opacity: 0.7 },
  text: { flex: 1, gap: Spacing[1] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  title: { fontWeight: '700', flexShrink: 1 },
});
