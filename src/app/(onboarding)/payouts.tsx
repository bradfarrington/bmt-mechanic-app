import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  CircleCheck,
  CreditCard,
  ExternalLink,
  IdCard,
  Landmark,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  Icon,
  IconTile,
  Notice,
  Overline,
  Screen,
  Stepper,
  Text,
} from '@/components/ui';
import {
  BrandGradient,
  DetailSizing,
  OnDark,
  Palette,
  Radius,
  Shadows,
  Sizing,
  Spacing,
} from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { refreshStripeStatus, SETUP_STEPS, startStripeOnboarding } from '@/lib/mechanic';

const NEEDS: readonly { icon: LucideIcon; label: string }[] = [
  { icon: UserRound, label: 'Your legal name and date of birth' },
  { icon: CreditCard, label: 'Sort code and account number' },
  { icon: IdCard, label: 'Photo ID (passport or driving licence)' },
];

/**
 * Stripe Connect. Step 2 of first-run setup, and also where the Locked status
 * button and Today's banner lead afterwards — so it works out which it is from
 * whether there is a screen to go back to.
 */
export default function PayoutsScreen() {
  const router = useRouter();
  const { mechanic, refreshMechanic } = useAuth();

  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Back from Stripe, but the account is not cleared for payouts yet. */
  const [unfinished, setUnfinished] = useState(false);

  // Pushed from the app there is somewhere to go back to; in the wizard this
  // is the first screen after the entry redirect.
  const inSetup = !router.canGoBack();
  const connected = !!mechanic?.stripe_payouts_enabled;

  function moveOn() {
    if (inSetup) router.replace('/service-area');
    else router.back();
  }

  async function onContinue() {
    setOpening(true);
    setError(null);
    setUnfinished(false);

    const returnUrl = Linking.createURL('payouts');
    const link = await startStripeOnboarding(returnUrl);
    if (!link.ok) {
      setError(link.error);
      setOpening(false);
      return;
    }

    // Closes itself when Stripe's return page bounces to `returnUrl`; a
    // mechanic who closes it by hand lands here just the same, so the account
    // is re-read either way rather than trusting how the browser ended.
    await WebBrowser.openAuthSessionAsync(link.url, returnUrl);

    const status = await refreshStripeStatus();
    await refreshMechanic();
    setOpening(false);

    if (!status.ok) setError(status.error);
    else if (!status.payoutsEnabled) setUnfinished(true);
  }

  return (
    <Screen
      title="Get paid"
      belowHeader={
        inSetup ? <Stepper step={2} total={SETUP_STEPS} label="Get paid" /> : undefined
      }
      footer={
        connected ? (
          <Button fullWidth size="xl" onPress={moveOn}>
            {inSetup ? 'Continue' : 'Done'}
          </Button>
        ) : (
          <View style={styles.actions}>
            <Button
              fullWidth
              size="xl"
              iconLeft={ExternalLink}
              loading={opening}
              onPress={onContinue}
            >
              Continue with Stripe
            </Button>
            {inSetup && (
              <Button fullWidth variant="ghost" disabled={opening} onPress={moveOn}>
                Skip for now
              </Button>
            )}
          </View>
        )
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">{connected ? 'Your bank is connected.' : 'Connect your bank.'}</Text>
        <Text color="textSecondary">
          {connected
            ? 'Stripe has everything it needs. You can go online and take jobs.'
            : 'One-off setup with Stripe so we can pay you for each job. Takes about 5 minutes.'}
        </Text>
      </View>

      {connected && (
        <Notice icon={CircleCheck} tone="success" title="Payouts are on">
          Each job is paid straight to the account you connected.
        </Notice>
      )}

      {!!error && (
        <Notice icon={Landmark} tone="danger" title="That didn’t work">
          {error}
        </Notice>
      )}

      {unfinished && !error && (
        <Notice icon={Landmark} tone="warn" title="Not quite finished">
          Stripe still needs something from you, or is checking what you sent. Carry on
          with Stripe to pick up where you left off.
        </Notice>
      )}

      <LinearGradient
        colors={BrandGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <IconTile icon={Landmark} tone="onDark" size="lg" />
        <View style={styles.heroCopy}>
          <Overline color={OnDark.cardText}>You&rsquo;ll be paid</Overline>
          <Text variant="h3" color="textInverse">
            24 hours after each job
          </Text>
          <Text variant="caption" color={OnDark.link}>
            Straight to the account you connect. No invoices, no chasing.
          </Text>
        </View>
      </LinearGradient>

      {!connected && (
        <View style={styles.needs}>
          <Overline>What you&rsquo;ll need</Overline>
          <Card padded={false}>
            {NEEDS.map((need, index) => (
              <View key={need.label} style={[styles.need, index > 0 && styles.needDivider]}>
                <Icon
                  icon={need.icon}
                  size={DetailSizing.rowIcon}
                  strokeWidth={2}
                  color={Palette.blue}
                />
                <Text variant="bodySm" style={styles.needLabel}>
                  {need.label}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      <View style={styles.spacer} />

      <Text variant="caption" color="textFaint" style={styles.footnote}>
        Stripe is our payment partner. Your bank details stay with them — not us.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  actions: { gap: Spacing[2] },
  hero: {
    flexDirection: 'row',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius.card,
    ...Shadows.hero,
  },
  heroCopy: { flex: 1, gap: Spacing[1] },
  needs: { gap: Spacing[2] },
  need: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sizing.inputGap,
    paddingVertical: Spacing[3],
    paddingHorizontal: Sizing.compactPadding,
  },
  needDivider: { borderTopWidth: 1, borderTopColor: Palette.borderSubtle },
  needLabel: { flex: 1, fontWeight: '700' },
  spacer: { flex: 1 },
  footnote: { textAlign: 'center' },
});
