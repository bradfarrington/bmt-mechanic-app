import { Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Palette, ReviewStars } from '@/constants/theme';

export interface StarsProps {
  /** 0–5; anything past the rating is drawn hollow. */
  rating: number;
  large?: boolean;
}

/** Five stars, filled up to the rating — amber, as on the public profile. */
export function Stars({ rating, large = false }: StarsProps) {
  const size = large ? ReviewStars.sizeLg : ReviewStars.size;
  const filled = Math.round(rating);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          strokeWidth={2}
          color={star <= filled ? Palette.warning : Palette.textDisabled}
          fill={star <= filled ? Palette.warning : 'transparent'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: ReviewStars.gap },
});
