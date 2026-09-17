import { useRouter } from 'expo-router';
import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { ChevronLeft } from 'lucide-react-native';
import { useContext, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  type ScrollViewProps,
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarOverhang } from '@/components/tab-bar';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Palette, Radius, Sizing, Spacing } from '@/constants/theme';

export interface ScreenProps {
  title: string;
  children: ReactNode;
  /** Show the back chevron. Off for tab roots. */
  back?: boolean;
  /** Right-hand header slot — an avatar, a help link, etc. */
  action?: ReactNode;
  /** Renders directly under the header, outside the scroll area (e.g. a Stepper). */
  belowHeader?: ReactNode;
  /** Pinned above the bottom inset — the primary CTA on a step screen. */
  footer?: ReactNode;
  /** Set false when the child manages its own scrolling (FlatList, map). */
  scrollable?: boolean;
  contentStyle?: ViewStyle;
  /** Pull-to-refresh. Ignored when `scrollable` is false. */
  refreshControl?: ScrollViewProps['refreshControl'];
  /**
   * Grow the scroll area's bottom inset while the keyboard is up (iOS), so a
   * CTA pinned to the foot of a form can still be scrolled into view. Leave off
   * on screens wrapped in a `KeyboardAvoidingView` — both would lift the
   * content.
   */
  avoidKeyboard?: boolean;
  /**
   * Replaces the header's title text — an avatar and a name on a message
   * thread. `title` stays as the header's accessibility label.
   */
  titleContent?: ReactNode;
  /** Overrides on the footer bar — a message composer sits on white. */
  footerStyle?: ViewStyle;
}

/**
 * The redesign's screen shell: a borderless header on the page background,
 * then the body. The body grows to fill the screen, so a `flex: 1` spacer can
 * pin a short form's CTA to the bottom.
 */
export function Screen({
  title,
  children,
  back = true,
  action,
  belowHeader,
  footer,
  scrollable = true,
  contentStyle,
  refreshControl,
  avoidKeyboard = false,
  titleContent,
  footerStyle,
}: ScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Only provided inside the tabs navigator. A tab root's content scrolls up
  // behind the status button, so it needs that much more room at the end.
  const inTabs = useContext(BottomTabBarHeightContext) !== undefined;

  // A footer clears the home indicator itself; otherwise the content has to.
  const paddingBottom = inTabs
    ? Sizing.screenPadding + TabBarOverhang
    : footer
      ? Spacing[5]
      : insets.bottom + Spacing[3];

  const body = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingBottom }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={avoidKeyboard}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: insets.top + Sizing.header },
        ]}
      >
        {back && router.canGoBack() && (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={Spacing[2]}
            style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
          >
            <Icon
              icon={ChevronLeft}
              size={Sizing.backIcon}
              strokeWidth={2}
              color={Palette.textSecondary}
            />
          </Pressable>
        )}
        {titleContent ? (
          <View
            style={styles.title}
            accessible
            accessibilityRole="header"
            accessibilityLabel={title}
          >
            {titleContent}
          </View>
        ) : (
          <Text variant="headerTitle" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
        {action}
      </View>

      {belowHeader}
      {body}

      {footer && (
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + Spacing[3] }, footerStyle]}
        >
          {footer}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.surface },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Sizing.screenPadding,
    backgroundColor: Palette.surface,
  },
  // The chevron's stroke, not its tap target, lines up with the page margin.
  backButton: {
    width: Sizing.backButton,
    height: Sizing.backButton,
    marginLeft: -(Sizing.backButton - Sizing.backIcon) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  backPressed: { backgroundColor: Palette.borderSubtle },
  title: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: Sizing.screenPadding,
    paddingTop: Spacing[2],
    gap: Spacing[4],
  },
  footer: {
    paddingHorizontal: Sizing.screenPadding,
    paddingTop: Spacing[3],
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
  },
});
