import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Card, IconTile, Overline, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export interface PlaceholderProps {
  icon: LucideIcon;
  /** Which mockup the real screen comes from, e.g. `02 · Today & offers`. */
  mockup: string;
  title: string;
  children: string;
}

/** Stands in for a hub screen's content until its journey is built. */
export function Placeholder({ icon, mockup, title, children }: PlaceholderProps) {
  return (
    <Card style={styles.card}>
      <IconTile icon={icon} size="lg" />
      <View style={styles.copy}>
        <Overline>{mockup}</Overline>
        <Text variant="h4">{title}</Text>
        <Text color="textSecondary">{children}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing[4] },
  copy: { gap: Spacing[1] },
});
