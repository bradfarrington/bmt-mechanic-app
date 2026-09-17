import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { LivePulse, Palette, Radius, Sizing } from '@/constants/theme';

export interface PulseDotProps {
  /** Diameter. Defaults to `Sizing.dot`; a pill passes `LivePulse.pillSize`. */
  size?: number;
  color?: string;
}

/** A breathing dot for a live status — `.pulse` in the mockups. */
export function PulseDot({ size = Sizing.dot, color = Palette.success }: PulseDotProps) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: LivePulse.dimmed,
          duration: LivePulse.halfCycleMs,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: LivePulse.halfCycleMs,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.dot, { width: size, height: size, backgroundColor: color, opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { borderRadius: Radius.pill },
});
