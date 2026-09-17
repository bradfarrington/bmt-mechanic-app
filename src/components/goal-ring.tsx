import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui';
import { GoalRing as Tokens, OnDark } from '@/constants/theme';
import { formatPence } from '@/lib/offers';

export interface GoalRingProps {
  earnedPence: number;
  goalPence: number;
}

/** Today's earnings as an arc of the daily goal. Sits on the brand gradient. */
export function GoalRing({ earnedPence, goalPence }: GoalRingProps) {
  const radius = (Tokens.size - Tokens.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = goalPence > 0 ? Math.min(1, Math.max(0, earnedPence / goalPence)) : 0;
  const centre = Tokens.size / 2;

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${formatPence(earnedPence)} of ${formatPence(goalPence)} daily goal`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }}
    >
      <Svg width={Tokens.size} height={Tokens.size}>
        <Circle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={Tokens.track}
          strokeWidth={Tokens.stroke}
          fill="none"
        />
        <Circle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={fraction >= 1 ? Tokens.met : Tokens.progress}
          strokeWidth={Tokens.stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - fraction)}
          fill="none"
          // Start at twelve o'clock rather than three.
          transform={`rotate(-90 ${centre} ${centre})`}
        />
      </Svg>
      <View style={styles.label}>
        <Text variant="ringValue" color="textInverse">
          {formatPence(earnedPence)}
        </Text>
        <Text variant="caption" color={OnDark.cardText}>
          of {formatPence(goalPence)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: Tokens.size, height: Tokens.size },
  label: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
