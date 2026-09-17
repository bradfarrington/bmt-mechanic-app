import type { LucideIcon } from 'lucide-react-native';
import { View, type ViewProps, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius, Sizing, Tones, type Tone } from '@/constants/theme';

export type IconTileSize = keyof typeof Sizing.iconTile;

export interface IconTileProps extends ViewProps {
  icon: LucideIcon;
  /** Background/foreground pair. Defaults to the pale-blue `accent`. */
  tone?: Tone;
  size?: IconTileSize;
}

const RADII: Record<IconTileSize, number> = {
  sm: Radius.input,
  md: Radius.inner,
  lg: Radius.tile,
  xl: Radius.tileXl,
};

/** An icon on a tinted rounded square — `.tile` in the redesign mockups. */
export function IconTile({
  icon,
  tone = 'accent',
  size = 'md',
  style,
  ...rest
}: IconTileProps) {
  const t = Tones[tone];
  const { box, glyph } = Sizing.iconTile[size];

  return (
    <View
      style={[
        styles.base,
        { width: box, height: box, borderRadius: RADII[size], backgroundColor: t.bg },
        style,
      ]}
      {...rest}
    >
      <Icon icon={icon} size={glyph} strokeWidth={2} color={t.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
