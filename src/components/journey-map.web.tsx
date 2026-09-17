import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { DetailSizing, Palette, Radius } from '@/constants/theme';

import type { JourneyMapProps } from './journey-map';

/** react-native-maps has no web build; the web target is only for layout checks. */
export function JourneyMap(_props: JourneyMapProps) {
  return (
    <View style={styles.map}>
      <Text variant="caption" color="textMuted">
        The map shows on a phone.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: DetailSizing.mapHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.tile,
    backgroundColor: Palette.blueTintStrong,
  },
});
