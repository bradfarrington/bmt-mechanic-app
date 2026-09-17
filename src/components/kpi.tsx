import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Palette, Radius, Sizing } from '@/constants/theme';

export interface KpiProps {
  label: string;
  value: string;
}

/** A small numeric summary tile — Today and Earnings. Three or four across; a row never scrolls. */
export function Kpi({ label, value }: KpiProps) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}, ${value}`}>
      <Text variant="kpiLabel" color="textMuted" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="kpiValue" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function KpiRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Sizing.kpi.gap },
  tile: {
    flex: 1,
    paddingVertical: Sizing.kpi.paddingY,
    paddingHorizontal: Sizing.kpi.paddingX,
    borderRadius: Radius.tile,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceCard,
  },
});
