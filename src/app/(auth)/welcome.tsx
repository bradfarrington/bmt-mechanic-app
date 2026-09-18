import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowRight,
  Banknote,
  BellRing,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@/components/ui';
import {
  BrandGradientDeep,
  OnDark,
  Palette,
  Radius,
  Shadows,
  Sizing,
  Spacing,
  Typography,
} from '@/constants/theme';
import { markWelcomeSeen } from '@/lib/welcome';

interface Slide {
  icon: LucideIcon;
  title: string;
  body: string;
}

// Each line checked against what the app and the CRM actually do: offers
// matched on area, hours and work; first to accept wins; checklists, photos
// and quotes on the job; the customer charged at completion and the
// mechanic's share sent through Stripe then (owner decision 2026-07-01).
const SLIDES: readonly Slide[] = [
  {
    icon: BellRing,
    title: 'Jobs come\nto you.',
    body: 'Set your area, your hours and the work you take on. When a job nearby matches, it lands on your phone — first to accept wins.',
  },
  {
    icon: ClipboardCheck,
    title: 'The whole job,\nin your pocket.',
    body: 'Directions, the car, the checklist, photos and quotes for extra work — then complete the job and charge the customer from the driveway.',
  },
  {
    icon: Banknote,
    title: 'Paid for every\njob you finish.',
    body: 'Your share goes to your bank through Stripe the moment a job is completed. No invoices, no chasing.',
  },
];

/**
 * The last slide's controls — dots, Get started, the sign-in line — are the
 * tallest, and every slide reserves that much. Otherwise the pager would
 * change height mid-swipe and the hero tiles would jump.
 */
const CONTROLS_HEIGHT =
  Sizing.dot +
  Spacing[4] +
  Sizing.buttonHeight.xl +
  Spacing[3] +
  Typography.caption.lineHeight;

/**
 * A first launch, signed out. Shown once per device (see `lib/welcome.ts`);
 * every way out marks it seen, so `/` goes straight to sign-in next time. The
 * customer app's carousel with a mechanic's slides: it ends at applying to
 * join, with sign-in beneath for someone already approved.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const last = page === SLIDES.length - 1;
  // Light status bar only while this screen is showing. Mounted regardless, it
  // would outlive the carousel under anything pushed on top — a deep link, a
  // notification — and leave white text on a light screen.
  const focused = useIsFocused();

  function leave(href: Href) {
    markWelcomeSeen();
    router.replace(href);
  }

  /** The wizard opens over sign-in, so its first step's back arrow leads there. */
  function apply() {
    markWelcomeSeen();
    router.replace('/login');
    router.push('/apply');
  }

  function next() {
    pager.current?.scrollTo({ x: width * (page + 1), animated: true });
  }

  return (
    <LinearGradient
      colors={BrandGradientDeep}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      {focused && <StatusBar style="light" />}

      <View
        style={[
          styles.top,
          { paddingTop: insets.top, height: insets.top + Sizing.header },
        ]}
      >
        {!last && (
          <Pressable
            onPress={() => leave('/login')}
            accessibilityRole="button"
            accessibilityLabel="Skip the introduction"
            hitSlop={Spacing[3]}
          >
            <Text variant="bodySm" color={OnDark.link} style={styles.skip}>
              Skip
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={styles.pager}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={{ width }}>
            <View style={styles.heroArea}>
              <View style={styles.heroTile}>
                <Icon
                  icon={slide.icon}
                  size={Sizing.heroIcon}
                  strokeWidth={1.5}
                  color={Palette.textInverse}
                />
              </View>
            </View>
            <View style={styles.copy}>
              <Text variant="hero" color="textInverse">
                {slide.title}
              </Text>
              <Text variant="bodyLg" color={OnDark.textSecondary}>
                {slide.body}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.controls,
          {
            height: CONTROLS_HEIGHT + insets.bottom + Spacing[3],
            paddingBottom: insets.bottom + Spacing[3],
          },
        ]}
      >
        {last ? (
          <>
            <Dots page={page} style={styles.dotsCentred} />
            <Button
              fullWidth
              size="xl"
              variant="onDark"
              onPress={apply}
            >
              Apply to join
            </Button>
            <View style={styles.signInRow}>
              <Text variant="caption" color={OnDark.textMuted}>
                Already a Book My Tech mechanic?{' '}
              </Text>
              <Text
                variant="caption"
                color="textInverse"
                style={styles.signIn}
                onPress={() => leave('/login')}
                accessibilityRole="link"
              >
                Sign in
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.row}>
            <Dots page={page} />
            <Button size="lg" variant="onDark" iconRight={ArrowRight} onPress={next}>
              Next
            </Button>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

function Dots({ page, style }: { page: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.dots, style]}>
      {SLIDES.map((slide, i) => (
        <View key={slide.title} style={[styles.dot, i === page && styles.dotOn]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: {
    paddingHorizontal: Spacing[5],
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skip: { fontWeight: '600' },
  pager: { flex: 1 },
  heroArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroTile: {
    width: Sizing.heroTile,
    height: Sizing.heroTile,
    borderRadius: Radius.hero,
    backgroundColor: OnDark.tile,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.halo,
  },
  copy: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[5],
    gap: Spacing[3],
  },
  controls: {
    paddingHorizontal: Spacing[5],
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: { flexDirection: 'row', gap: Spacing[2] },
  dotsCentred: { justifyContent: 'center', marginBottom: Spacing[4] },
  dot: {
    width: Sizing.dot,
    height: Sizing.dot,
    borderRadius: Radius.pill,
    backgroundColor: Palette.textDisabled,
  },
  dotOn: { width: Sizing.dotActive, backgroundColor: Palette.textInverse },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing[3],
  },
  signIn: { fontWeight: '600', textDecorationLine: 'underline' },
});
