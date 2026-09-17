import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View, type ViewProps, StyleSheet } from 'react-native';

import { Card, type CardProps } from '@/components/ui/card';
import { IconTile } from '@/components/ui/icon-tile';
import { Text } from '@/components/ui/text';
import { Spacing, type PaletteColor, type Tone } from '@/constants/theme';

export interface NoticeProps extends Omit<ViewProps, 'children'> {
  icon: LucideIcon;
  title: string;
  /**
   * `info` — pale-blue callout; `danger` — red border and tile; `warn` — amber
   * card, tile and copy ("Got a job on the go?").
   */
  tone?: 'info' | 'danger' | 'warn' | 'success';
  /** A string is set as the caption under the title; anything else renders as given. */
  children?: ReactNode;
}

const LOOKS: Record<
  NonNullable<NoticeProps['tone']>,
  { card: CardProps['tone']; tile: Tone; title: PaletteColor; copy: PaletteColor }
> = {
  info: { card: 'tint', tile: 'accent', title: 'textPrimary', copy: 'textSecondary' },
  danger: { card: 'danger', tile: 'error', title: 'textPrimary', copy: 'textSecondary' },
  warn: { card: 'warn', tile: 'pending', title: 'warningText', copy: 'warningText' },
  success: { card: 'success', tile: 'success', title: 'successText', copy: 'successText' },
};

/** A titled callout card with an icon tile — "Heads up", "Wrong app for this account". */
export function Notice({ icon, title, tone = 'info', children, style, ...rest }: NoticeProps) {
  const look = LOOKS[tone];

  return (
    <Card tone={look.card} style={[styles.card, style]} {...rest}>
      <IconTile icon={icon} tone={look.tile} />
      <View style={styles.body}>
        <Text color={look.title} style={styles.title}>
          {title}
        </Text>
        {typeof children === 'string' ? (
          <Text variant="caption" color={look.copy}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
  },
  body: { flex: 1, gap: Spacing[1] },
  title: { fontWeight: '700' },
});
