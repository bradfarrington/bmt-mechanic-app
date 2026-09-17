import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

// From the files, not the barrel: the tab bar uses this, and the barrel reaches
// the tab bar through `Screen`.
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DetailSizing, Palette, Sizing, Spacing } from '@/constants/theme';

export interface ChoiceItem {
  key: string;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

/** A card of tappable rows with a trailing chevron — "Or pick when". */
export function ChoiceList({ items, disabled }: { items: readonly ChoiceItem[]; disabled?: boolean }) {
  return (
    <Card padded={false}>
      {items.map((item, index) => (
        <Pressable
          key={item.key}
          onPress={item.onPress}
          disabled={disabled}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.row,
            index > 0 && styles.divider,
            pressed && styles.pressed,
            disabled && styles.disabled,
          ]}
        >
          <Icon icon={item.icon} size={DetailSizing.rowIcon} strokeWidth={2} color={Palette.blue} />
          <Text variant="bodySm" style={styles.label}>
            {item.label}
          </Text>
          <Icon
            icon={ChevronRight}
            size={Sizing.rowChevron}
            strokeWidth={2}
            color={Palette.textMuted}
          />
        </Pressable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Sizing.compactPadding,
  },
  divider: { borderTopWidth: 1, borderTopColor: Palette.borderSubtle },
  label: { flex: 1, fontWeight: '700' },
  pressed: { backgroundColor: Palette.borderSubtle },
  disabled: { opacity: 0.5 },
});
