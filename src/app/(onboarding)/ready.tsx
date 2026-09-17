import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, MapPin, Power, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PushPrompt } from '@/components/push-prompt';
import { Button, Icon, IconTile, Text } from '@/components/ui';
import {
  BrandGradientDeep,
  Halo,
  OnDark,
  OnlineGradient,
  Palette,
  Radius,
  ReadyHero,
  Sizing,
  Spacing,
} from '@/constants/theme';
import { useAuth } from '@/lib/auth';

const NEXT: readonly { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: MapPin,
    title: 'Location while working',
    body: 'So customers can see when you’re on the way. Nothing tracked when you’re offline.',
  },
];

export default function ReadyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mechanic } = useAuth();
  const canWork = !!mechanic?.stripe_payouts_enabled;

  return (
    <LinearGradient
      colors={BrandGradientDeep}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.root,
        { paddingTop: insets.top + Spacing[8], paddingBottom: insets.bottom + Spacing[5] },
      ]}
    >
      <StatusBar style="light" />

      <View style={styles.halo}>
        <LinearGradient
          colors={OnlineGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.power}
        >
          <Icon icon={Power} size={ReadyHero.glyph} strokeWidth={2} color={Palette.textInverse} />
        </LinearGradient>
      </View>

      <View style={styles.copy}>
        <Text variant="hero" color="textInverse">
          You&rsquo;re all set.
        </Text>
        <Text variant="bodyLg" color={OnDark.textStrong}>
          {canWork
            ? 'Go online with the button at the bottom of the screen when you’re ready. ' +
              'When a job matches you’ll get an offer — first to accept wins.'
            : 'One thing left: connect your bank so we can pay you. Until then the ' +
              'status button stays locked — tap it to finish.'}
        </Text>
      </View>

      <PushPrompt
        onDark
        reason="Otherwise you’ll miss offers when the app is closed. First to accept wins."
      />

      {NEXT.map((item) => (
        <View key={item.title} style={styles.card}>
          <IconTile icon={item.icon} tone="onDark" size="lg" />
          <View style={styles.cardCopy}>
            <Text color="textInverse" style={styles.cardTitle}>
              {item.title}
            </Text>
            <Text variant="caption" color={OnDark.cardText}>
              {item.body}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.spacer} />

      <Button
        fullWidth
        size="xl"
        variant="onDark"
        iconRight={ArrowRight}
        onPress={() => router.replace('/today')}
      >
        Go to my dashboard
      </Button>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: Sizing.screenPadding, gap: Spacing[3] },
  // The CSS `0 0 0 10px` green spread, as a disc behind the button.
  halo: {
    alignSelf: 'flex-start',
    padding: ReadyHero.halo,
    margin: -ReadyHero.halo,
    borderRadius: Radius.pill,
    backgroundColor: Halo.onlineGreen,
  },
  power: {
    width: ReadyHero.box,
    height: ReadyHero.box,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  copy: { gap: Spacing[2], marginTop: Spacing[5], marginBottom: Spacing[3] },
  card: {
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: OnDark.fill,
    backgroundColor: OnDark.tile,
  },
  cardCopy: { flex: 1, gap: Spacing[1] / 2 },
  cardTitle: { fontWeight: '700' },
  spacer: { flex: 1 },
});
