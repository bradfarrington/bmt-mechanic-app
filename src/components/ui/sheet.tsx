import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { Palette, Radius, Scrim, Sheet as Tokens, Sizing, Spacing } from '@/constants/theme';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** A bottom sheet for a short list of choices. Tap outside, or back on Android, to dismiss. */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing[4] }]}>
        <View style={styles.grabber} />
        <Text variant="h4" accessibilityRole="header">
          {title}
        </Text>
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: Scrim.busy },
  sheet: {
    gap: Spacing[3],
    paddingTop: Spacing[3],
    paddingHorizontal: Sizing.screenPadding,
    borderTopLeftRadius: Radius.hero,
    borderTopRightRadius: Radius.hero,
    backgroundColor: Palette.surface,
  },
  grabber: {
    alignSelf: 'center',
    width: Tokens.grabberWidth,
    height: Tokens.grabberHeight,
    borderRadius: Radius.pill,
    backgroundColor: Palette.textDisabled,
  },
});
