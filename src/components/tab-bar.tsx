import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Power, Wrench, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  BrandGradient,
  Halo,
  OnlineGradient,
  Palette,
  Radius,
  Shadows,
  TabBar as TabBarTokens,
  type PaletteColor,
} from '@/constants/theme';
import { useStatus, type MechanicStatus } from '@/lib/status';

export interface TabItem {
  /** The route file's name inside the tabs group, e.g. `today`. */
  name: string;
  label: string;
  icon: LucideIcon;
}

export interface TabBarProps extends BottomTabBarProps {
  /** In display order. The status button sits between the two halves. */
  items: readonly TabItem[];
}

/**
 * How far the status button's ring rises above the bar's top edge. Tab screens
 * pad their scroll content by this much so the last row clears the button —
 * see `components/ui/screen.tsx`.
 */
export const TabBarOverhang = TabBarTokens.fabLift + TabBarTokens.fabRing;

interface StatusLook {
  label: string;
  labelColor: PaletteColor;
  icon: LucideIcon;
  iconColor: string;
  /** A gradient fill; without one the button is white. */
  gradient?: readonly [string, string, ...string[]];
  shadow: object;
  /** What a screen reader hears, including what a tap will do. */
  accessibilityLabel: string;
}

const LOOKS: Record<MechanicStatus, StatusLook> = {
  online: {
    label: 'Online',
    labelColor: 'success',
    icon: Power,
    iconColor: Palette.textInverse,
    gradient: OnlineGradient,
    shadow: Shadows.onlineHalo,
    accessibilityLabel: 'You are online. Go offline',
  },
  offline: {
    label: 'Offline',
    labelColor: 'textMuted',
    icon: Power,
    iconColor: Palette.textSecondary,
    shadow: Shadows.fabOffline,
    accessibilityLabel: 'You are offline. Go online',
  },
  on_job: {
    label: 'On a job',
    labelColor: 'blue',
    icon: Wrench,
    iconColor: Palette.textInverse,
    gradient: BrandGradient,
    shadow: Shadows.fab,
    accessibilityLabel: 'You are on a job',
  },
  locked: {
    label: 'Locked',
    labelColor: 'textMuted',
    icon: Power,
    iconColor: Palette.textSecondary,
    shadow: Shadows.fabOffline,
    accessibilityLabel: 'Locked until payouts are set up. Set up payouts',
  },
};

/** The Online state's green ring, fading out and back — `Halo.onlineGreen`. */
function OnlineHalo() {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: TabBarTokens.fabHaloCycleMs / 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: TabBarTokens.fabHaloCycleMs / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View pointerEvents="none" style={[styles.halo, { opacity }]} />;
}

/**
 * The hub tab bar: Today · Jobs · [Status] · Inbox · Account.
 *
 * The centre button is not a tab — it shows whether the mechanic is Online,
 * Offline or On a job, and toggles the first two. Locked (no payouts yet), it
 * opens payout setup. It is on every hub screen so they never have to wonder
 * which mode they are in.
 *
 * The bar is pulled up over the scene by `TabBarOverhang` rather than letting
 * the button poke out of it: a child outside its parent's bounds cannot be
 * tapped on iOS or Android, so the top of the button would be dead. The
 * strip either side of the button is see-through and passes touches down to
 * the screen behind.
 */
export function TabBar({ state, navigation, insets, items }: TabBarProps) {
  const router = useRouter();
  const { status, pending, toggle } = useStatus();
  const look = LOOKS[status];
  // On a job there is nothing to press; locked, the button leads to the fix.
  const pressable = status !== 'on_job' && !pending;

  function onStatusPress() {
    if (status === 'locked') router.push('/payouts');
    else toggle();
  }

  const half = Math.ceil(items.length / 2);

  function renderTab(item: TabItem) {
    const index = state.routes.findIndex((route) => route.name === item.name);
    const route = state.routes[index];
    if (!route) return null;

    const focused = state.index === index;

    // The navigator's own handler, so a screen listening for `tabPress` (to
    // scroll to top, say) still hears it.
    function onPress() {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    }

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={item.label}
        style={styles.tab}
      >
        <Icon
          icon={item.icon}
          size={TabBarTokens.iconSize}
          strokeWidth={focused ? TabBarTokens.iconStrokeActive : TabBarTokens.iconStroke}
          color={focused ? Palette.blue : Palette.textMuted}
        />
        <Text variant="tabLabel" color={focused ? 'blue' : 'textMuted'}>
          {item.label}
        </Text>
      </Pressable>
    );
  }

  const glyph = (
    <Icon
      icon={look.icon}
      size={TabBarTokens.fabIconSize}
      strokeWidth={TabBarTokens.fabIconStroke}
      color={look.iconColor}
    />
  );

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          { paddingBottom: Math.max(insets.bottom, TabBarTokens.minBottomInset) },
        ]}
      >
        {items.slice(0, half).map(renderTab)}
        {/* The label takes the button's colour, so the state reads from a distance. */}
        <View style={[styles.tab, styles.statusLabel]}>
          <Text variant="tabLabel" color={look.labelColor}>
            {look.label}
          </Text>
        </View>
        {items.slice(half).map(renderTab)}
      </View>

      <View style={styles.fabSlot} pointerEvents="box-none">
        {status === 'online' && <OnlineHalo />}
        <View style={[styles.fabRing, look.shadow]}>
          <Pressable
            onPress={onStatusPress}
            disabled={!pressable}
            accessibilityRole="button"
            accessibilityLabel={look.accessibilityLabel}
            accessibilityState={{ disabled: !pressable, busy: pending }}
            style={({ pressed }) => pressed && styles.pressed}
          >
            {look.gradient ? (
              <LinearGradient
                colors={look.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fab}
              >
                {glyph}
              </LinearGradient>
            ) : (
              <View style={styles.fab}>{glyph}</View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: -TabBarOverhang,
    paddingTop: TabBarOverhang,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: TabBarTokens.paddingTop,
    backgroundColor: Palette.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
  },
  tab: {
    flex: 1,
    height: TabBarTokens.contentHeight,
    alignItems: 'center',
    gap: TabBarTokens.labelGap,
  },
  statusLabel: {
    // Measured from the bar's top edge in the mockup; the row starts below its padding.
    paddingTop: TabBarTokens.fabLabelTop - TabBarTokens.paddingTop,
  },
  fabSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // The CSS `0 0 0 10px` green spread: a disc wider than the white ring by
  // `fabHalo` all round, sitting behind it.
  halo: {
    position: 'absolute',
    top: -TabBarTokens.fabHalo,
    width: TabBarTokens.fabSize + 2 * (TabBarTokens.fabRing + TabBarTokens.fabHalo),
    height: TabBarTokens.fabSize + 2 * (TabBarTokens.fabRing + TabBarTokens.fabHalo),
    borderRadius: Radius.pill,
    backgroundColor: Halo.onlineGreen,
  },
  // The ring is the CSS `0 0 0 5px #fff` spread: a white disc 5pt wider than
  // the button all round, carrying the state's glow.
  fabRing: {
    padding: TabBarTokens.fabRing,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceCard,
  },
  fab: {
    width: TabBarTokens.fabSize,
    height: TabBarTokens.fabSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceCard,
  },
  pressed: { opacity: 0.85 },
});
