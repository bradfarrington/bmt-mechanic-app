import { View, type ViewProps, StyleSheet } from 'react-native';

import { PulseDot } from '@/components/ui/pulse-dot';
import { Text } from '@/components/ui/text';
import { LivePulse, Radius, Sizing, Tones, type Tone } from '@/constants/theme';

export interface PillProps extends ViewProps {
  children: string;
  tone?: Tone;
  /** Leading status dot in the pill's foreground colour. */
  dot?: boolean;
  /** A bigger, sentence-case label — a repair's price tag. */
  large?: boolean;
  /** A breathing green dot instead — a live status, e.g. "On the way". */
  pulse?: boolean;
}

export function Pill({
  children,
  tone = 'neutral',
  dot,
  pulse,
  large = false,
  style,
  ...rest
}: PillProps) {
  const t = Tones[tone];
  const border = 'border' in t ? t.border : undefined;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: t.bg,
          borderColor: border ?? 'transparent',
          borderWidth: border ? 1 : 0,
        },
        large && styles.large,
        style,
      ]}
      {...rest}
    >
      {pulse ? (
        <PulseDot size={LivePulse.pillSize} />
      ) : (
        dot && <View style={[styles.dot, { backgroundColor: t.fg }]} />
      )}
      <Text variant={large ? 'pillLg' : 'pill'} color={t.fg}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingVertical: Sizing.pillPaddingY,
    paddingHorizontal: Sizing.pillPaddingX,
    borderRadius: Radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  large: { paddingVertical: Sizing.pillLgPaddingY },
});
