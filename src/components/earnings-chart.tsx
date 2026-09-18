import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Text } from '@/components/ui';
import { EarningsChart, Palette, Radius, Spacing } from '@/constants/theme';
import type { SeriesPoint } from '@/lib/earnings';

export interface EarningsChartProps {
  points: readonly SeriesPoint[];
  /** The three captions under the chart. */
  labels: readonly [string, string, string];
}

/**
 * The area chart on Earnings — `design/TOKENS.md` § Chart. A vibe, not an
 * analysis: brand-blue line over a blue wash, three dates underneath, and the
 * figures live in the KPI row above it.
 */
export function EarningsChartView({ points, labels }: EarningsChartProps) {
  const [width, setWidth] = useState(0);
  const height = EarningsChart.height;

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const max = Math.max(0, ...points.map((point) => point.pence));
  const inset = EarningsChart.stroke;
  const usable = height - inset * 2;
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const line = points.map((point, index) => {
    const x = index * step;
    const y = max > 0 ? inset + usable - (point.pence / max) * usable : height - inset;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = line.join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <View style={styles.wrap}>
      <View style={styles.chart} onLayout={onLayout}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="wash" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={EarningsChart.wash[0]} />
                <Stop offset="1" stopColor={EarningsChart.wash[1]} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={width} height={height} rx={Radius.input} fill="url(#wash)" />
            {points.length > 1 && (
              <>
                <Path d={areaPath} fill={max > 0 ? EarningsChart.fill : 'transparent'} />
                <Path
                  d={linePath}
                  fill="none"
                  stroke={max > 0 ? Palette.blue : EarningsChart.empty}
                  strokeWidth={EarningsChart.stroke}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
          </Svg>
        )}
      </View>
      <View style={styles.labels}>
        {labels.map((label, index) => (
          <Text key={`${index}-${label}`} variant="caption" color="textMuted">
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing[2] },
  chart: { height: EarningsChart.height, borderRadius: Radius.input, overflow: 'hidden' },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
});
