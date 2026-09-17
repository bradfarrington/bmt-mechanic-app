import { Image } from 'expo-image';
import { View, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { AvatarTints, Radius } from '@/constants/theme';

export interface AvatarProps {
  /** Full name — initials are derived from the first two words. */
  name: string;
  size?: number;
  /** Index into the tint palette; cycles, so stacked avatars vary. */
  tint?: number;
  /** Remote or local image; falls back to initials when absent or broken. */
  source?: string | null;
  /** A rounded square rather than a circle — sits beside icon tiles on a card. */
  rounded?: boolean;
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, size = 32, tint = 0, source, rounded = false }: AvatarProps) {
  const t = AvatarTints[tint % AvatarTints.length];
  const dimensions = {
    width: size,
    height: size,
    borderRadius: rounded ? Radius.tile : size / 2,
  };

  if (source) {
    return (
      <Image
        source={source}
        style={dimensions}
        contentFit="cover"
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View style={[styles.fallback, dimensions, { backgroundColor: t.bg }]}>
      <Text
        color={t.fg}
        style={{ fontSize: size * 0.38, fontWeight: '600', lineHeight: size * 0.48 }}
      >
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
