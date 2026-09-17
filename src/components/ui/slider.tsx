import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { Palette, Radius, Slider as SliderTokens } from '@/constants/theme';

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
  /** How a value is read out — "8 miles". */
  formatValue?: (value: number) => string;
}

/** A single-thumb slider — `.slider` in the mockups. Tap or drag anywhere along it. */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  accessibilityLabel,
  formatValue = String,
}: SliderProps) {
  const track = useRef<View>(null);
  // The track's position on screen, measured as a drag starts: `locationX` is
  // relative to whichever child was touched, so it cannot be used.
  const frame = useRef({ x: 0, width: 0 });
  const [width, setWidth] = useState(0);

  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  const fraction = max > min ? (clamp(value) - min) / (max - min) : 0;

  function valueAt(pageX: number) {
    const { x, width: trackWidth } = frame.current;
    if (trackWidth <= 0) return value;
    const ratio = Math.min(1, Math.max(0, (pageX - x) / trackWidth));
    return clamp(min + Math.round((ratio * (max - min)) / step) * step);
  }

  function onGrant(event: GestureResponderEvent) {
    const pageX = event.nativeEvent.pageX;
    track.current?.measureInWindow((x, _y, trackWidth) => {
      frame.current = { x, width: trackWidth };
      onChange(valueAt(pageX));
    });
  }

  return (
    <View
      style={styles.hitArea}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onGrant}
      onResponderMove={(event) => onChange(valueAt(event.nativeEvent.pageX))}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value, text: formatValue(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) =>
        onChange(clamp(value + (event.nativeEvent.actionName === 'increment' ? step : -step)))
      }
    >
      <View
        ref={track}
        style={styles.track}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        <View style={[styles.fill, { width: fraction * width }]} />
      </View>
      <View
        pointerEvents="none"
        style={[styles.thumb, { left: fraction * width - SliderTokens.thumb / 2 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: { height: SliderTokens.hitHeight, justifyContent: 'center' },
  track: {
    height: SliderTokens.track,
    borderRadius: Radius.pill,
    backgroundColor: Palette.border,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: Palette.blue },
  thumb: {
    position: 'absolute',
    width: SliderTokens.thumb,
    height: SliderTokens.thumb,
    borderRadius: Radius.pill,
    borderWidth: SliderTokens.thumbBorder,
    borderColor: Palette.blue,
    backgroundColor: Palette.surfaceCard,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
  },
});
