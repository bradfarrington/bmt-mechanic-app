import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Overline } from '@/components/ui/overline';
import { Palette, Radius, Sizing, Spacing } from '@/constants/theme';

export interface StepperProps {
  /** 1-based. */
  step: number;
  total?: number;
  /** Short name of the current step — "Your vehicle", "When". */
  label: string;
}

/**
 * The booking flow's progress: a thin filling track over "Step N · Label" and
 * "N of M". Sits between the header and the scroll area via `Screen`'s
 * `belowHeader` slot, on the page background like the header above it.
 */
export function Stepper({ step, total = 4, label }: StepperProps) {
  const progress = useSharedValue(step / total);

  useEffect(() => {
    progress.value = withTiming(step / total, { duration: 200 });
  }, [step, total, progress]);

  const fill = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${step} of ${total}, ${label}`}
      accessibilityValue={{ min: 0, max: total, now: step }}
    >
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fill]} />
      </View>
      <View style={styles.row}>
        <Overline>{`Step ${step} · ${label}`}</Overline>
        <Overline>{`${step} of ${total}`}</Overline>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Sizing.screenPadding,
    paddingTop: Spacing[1],
    paddingBottom: Spacing[3],
    backgroundColor: Palette.surface,
  },
  track: {
    height: Sizing.stepperTrack,
    backgroundColor: Palette.borderSubtle,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: Palette.blue, borderRadius: Radius.pill },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[2],
  },
});
