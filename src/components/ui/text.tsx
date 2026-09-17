import {
  Platform,
  Text as RNText,
  type TextProps as RNTextProps,
  StyleSheet,
  type TextStyle,
} from 'react-native';

import {
  familyOfFace,
  fontFace,
  Palette,
  Typography,
  type PaletteColor,
} from '@/constants/theme';

export type TextVariant = keyof typeof Typography;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  /** Any palette token — defaults to `textPrimary`. */
  color?: PaletteColor | (string & {});
}

/**
 * The one place type styles are defined. Screens should never set `fontSize`
 * directly — pick a variant from the heading/body scale in
 * `docs/03-design-system.md`.
 *
 * A `fontWeight` in `style` still works on native, where the weight lives in
 * the face's name: it is swapped for that weight's face.
 */
export function Text({
  variant = 'body',
  color = 'textPrimary',
  style,
  ...rest
}: TextProps) {
  const resolved = color in Palette ? Palette[color as PaletteColor] : color;
  return (
    <RNText
      style={[styles[variant], { color: resolved }, style, weightFace(variant, style)]}
      {...rest}
    />
  );
}

function weightFace(
  variant: TextVariant,
  style: TextProps['style'],
): TextStyle | undefined {
  if (Platform.OS === 'web' || !style) return undefined;

  const { fontWeight, fontFamily } = StyleSheet.flatten(style);
  if (fontWeight == null) return undefined;

  const family = familyOfFace(fontFamily ?? Typography[variant].fontFamily);
  if (!family) return undefined;

  return { ...fontFace(family, fontWeight), fontWeight: undefined };
}

const styles = StyleSheet.create({
  display: Typography.display,
  h1: Typography.h1,
  h2: Typography.h2,
  h3: Typography.h3,
  h4: Typography.h4,
  hero: Typography.hero,
  headerTitle: Typography.headerTitle,
  bodyLg: Typography.bodyLg,
  body: Typography.body,
  bodySm: Typography.bodySm,
  caption: Typography.caption,
  label: Typography.label,
  button: Typography.button,
  overline: Typography.overline,
  pill: Typography.pill,
  tabLabel: Typography.tabLabel,
  amount: Typography.amount,
  plate: Typography.plate,
  tileTitle: Typography.tileTitle,
  pillLg: Typography.pillLg,
  cardNumber: Typography.cardNumber,
  mono: Typography.mono,
  monoSm: Typography.monoSm,
  payout: Typography.payout,
  ringValue: Typography.ringValue,
  jobTime: Typography.jobTime,
  kpiLabel: Typography.kpiLabel,
  kpiValue: Typography.kpiValue,
});
