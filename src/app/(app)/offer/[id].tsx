import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Car,
  Check,
  ChevronRight,
  Clock,
  ClockAlert,
  MapPin,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Icon, IconTile, Overline, Pill, Screen, Text } from '@/components/ui';
import {
  BrandGradient,
  DetailSizing,
  OfferHero,
  OnDark,
  Palette,
  Radius,
  Sizing,
  Spacing,
} from '@/constants/theme';
import { useOfferActions } from '@/hooks/use-offer-actions';
import {
  fetchOffer,
  fetchOffers,
  formatPence,
  offerTitle,
  offerVehicle,
  offerWhere,
  type Offer,
} from '@/lib/offers';

type Phase =
  | { kind: 'loading' }
  | { kind: 'ready'; offer: Offer }
  /** Accepted by somebody else, already answered, or never there. */
  | { kind: 'gone'; others: Offer[] }
  | { kind: 'error'; message: string };

/** What else is on offer, for the "gone" screen. Empty if that cannot be read either. */
async function otherOffers(exceptId: string) {
  const rest = await fetchOffers();
  return rest.ok ? rest.offers.filter((offer) => offer.offerId !== exceptId) : [];
}

interface DetailProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}

function Detail({ icon, label, children }: DetailProps) {
  return (
    <View style={styles.detail}>
      <View style={styles.detailLabel}>
        <Icon icon={icon} size={OfferHero.detailIcon} strokeWidth={2} color={OnDark.cardText} />
        <Text variant="caption" color={OnDark.cardText}>
          {label}
        </Text>
      </View>
      {children}
    </View>
  );
}

/**
 * One offer, full screen — opened from the feed or from a push. Arrives with
 * `taken=1` when the feed's Accept button has just lost the race.
 */
export default function OfferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, taken } = useLocalSearchParams<{ id: string; taken?: string }>();
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });

  async function showGone() {
    setPhase({ kind: 'gone', others: await otherOffers(id) });
  }

  useEffect(() => {
    let active = true;

    (async () => {
      const result = taken ? null : await fetchOffer(id);
      if (!active) return;

      if (result?.ok && result.offer) {
        setPhase({ kind: 'ready', offer: result.offer });
      } else if (!result || result.ok || result.gone || result.taken) {
        // An answered offer is simply absent from the CRM's reply.
        const others = await otherOffers(id);
        if (active) setPhase({ kind: 'gone', others });
      } else {
        setPhase({ kind: 'error', message: result.error });
      }
    })();

    return () => {
      active = false;
    };
  }, [id, taken]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/today'));

  const actions = useOfferActions({
    onTaken: () => void showGone(),
    onAccepted: close,
    onDeclined: close,
  });

  if (phase.kind === 'loading') {
    return (
      <Screen title="Offer">
        <ActivityIndicator color={Palette.blue} style={styles.loading} />
      </Screen>
    );
  }

  if (phase.kind === 'error') {
    return (
      <Screen title="Offer">
        <Card elevated style={styles.goneCard}>
          <IconTile icon={ClockAlert} tone="neutral" size="xl" />
          <Text variant="h2" style={styles.centred}>
            That didn’t load.
          </Text>
          <Text color="textSecondary" style={styles.centred}>
            {phase.message}
          </Text>
        </Card>
        <View style={styles.spacer} />
        <Button fullWidth onPress={close}>
          Back to offers
        </Button>
      </Screen>
    );
  }

  if (phase.kind === 'gone') {
    return (
      <Screen title="Offer">
        <Card elevated style={styles.goneCard}>
          <IconTile icon={ClockAlert} tone="neutral" size="xl" />
          <Text variant="h2" style={styles.centred}>
            Someone got there first.
          </Text>
          <Text color="textSecondary" style={styles.centred}>
            This job’s no longer available. It happens — the faster you’re online and near the
            phone, the more you’ll grab.
          </Text>
        </Card>

        {phase.others.length > 0 && (
          <View style={styles.others}>
            <Overline>Other open jobs</Overline>
            {phase.others.map((other) => (
              <Pressable
                key={other.offerId}
                accessibilityRole="button"
                onPress={() =>
                  router.replace({ pathname: '/offer/[id]', params: { id: other.offerId } })
                }
              >
                <Card style={styles.other}>
                  <IconTile icon={Wrench} />
                  <View style={styles.otherCopy}>
                    <Text variant="bodySm" style={styles.strong} numberOfLines={1}>
                      {offerTitle(other)}
                    </Text>
                    <Text variant="caption" color="textMuted" numberOfLines={1}>
                      {offerWhere(other)} · {formatPence(other.payoutPence)}
                    </Text>
                  </View>
                  <Icon
                    icon={ChevronRight}
                    size={Sizing.rowChevron}
                    strokeWidth={2}
                    color={Palette.textMuted}
                  />
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.spacer} />
        <Button fullWidth onPress={close}>
          Back to offers
        </Button>
      </Screen>
    );
  }

  const { offer } = phase;
  const payout = formatPence(offer.payoutPence);

  return (
    <LinearGradient
      colors={BrandGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.root, { paddingTop: insets.top + Spacing[3] }]}
    >
      <StatusBar style="light" />

      <View style={styles.top}>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={Spacing[2]}
          style={styles.close}
        >
          <Icon icon={X} size={DetailSizing.rowIcon} strokeWidth={2} color={Palette.textInverse} />
        </Pressable>
        <Pill tone="onDark">First to accept wins</Pill>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroTile}>
          <Icon icon={Wrench} size={OfferHero.glyph} strokeWidth={2} color={Palette.textInverse} />
        </View>
        <View>
          <Overline color={OnDark.cardText}>You earn</Overline>
          <Text variant="payout" color="textInverse">
            {payout}
          </Text>
          <Text variant="bodyLg" color={OnDark.textStrong}>
            Paid 24 hours after you complete the job.
          </Text>
        </View>

        <View style={styles.grid}>
          <Detail icon={Clock} label="When">
            <Text color="textInverse" style={styles.strong}>
              {offer.when ?? 'To be confirmed'}
            </Text>
          </Detail>
          <Detail icon={MapPin} label="Where">
            <Text color="textInverse" style={styles.strong}>
              {offerWhere(offer)}
            </Text>
          </Detail>
          <Detail icon={Car} label="Vehicle">
            <Text color="textInverse" style={styles.strong}>
              {offerVehicle(offer)}
            </Text>
            {!!offer.vehicle.reg && (
              <Text variant="mono" color="textInverse">
                {offer.vehicle.reg}
              </Text>
            )}
          </Detail>
          <Detail icon={Zap} label="Arrival">
            <Text color="textInverse" style={styles.strong}>
              {offer.needsArrivalWindow ? 'You pick the window' : 'Window is set'}
            </Text>
          </Detail>
        </View>

        <View style={styles.panel}>
          <Overline color={OnDark.cardText}>The job</Overline>
          {(offer.repairs.length > 0
            ? offer.repairs
            : [{ description: offerTitle(offer), hours: null }]
          ).map((repair, index) => (
            <View key={`${repair.description}-${index}`} style={styles.repair}>
              <Text color="textInverse" style={styles.repairName}>
                {repair.description}
              </Text>
              {repair.hours != null && (
                <Text variant="caption" color={OnDark.cardText}>
                  {repair.hours}h
                </Text>
              )}
            </View>
          ))}
        </View>

        {!!offer.specialInstructions?.trim() && (
          <View style={styles.panel}>
            <Overline color={OnDark.cardText}>From the customer</Overline>
            <Text color={OnDark.textStrong} style={styles.quote}>
              “{offer.specialInstructions.trim()}”
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[3] }]}>
        <Button
          fullWidth
          size="xl"
          variant="success"
          iconLeft={Check}
          loading={actions.busyFor(offer.offerId) === 'accept'}
          disabled={actions.busy}
          style={styles.accept}
          onPress={() => void actions.accept(offer.offerId)}
        >
          {`Accept job · ${payout}`}
        </Button>
        <Text
          color={OnDark.link}
          style={styles.decline}
          accessibilityRole="button"
          onPress={actions.busy ? undefined : () => void actions.decline(offer.offerId)}
        >
          {actions.busyFor(offer.offerId) === 'decline' ? 'Declining…' : 'Decline'}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { marginTop: Spacing[6] },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Sizing.screenPadding,
  },
  close: {
    width: Sizing.backButton,
    height: Sizing.backButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: OnDark.fill,
  },
  scroll: { flex: 1 },
  content: { padding: Sizing.screenPadding, gap: Spacing[4] },
  heroTile: {
    width: OfferHero.tile,
    height: OfferHero.tile,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: OfferHero.tileRadius,
    backgroundColor: OnDark.fill,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  detail: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: Spacing[1],
    padding: Spacing[4],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: OnDark.fill,
    backgroundColor: OnDark.tile,
  },
  detailLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  panel: {
    gap: Spacing[2],
    padding: Spacing[4],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: OnDark.fill,
    backgroundColor: OnDark.tile,
  },
  repair: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  repairName: { flex: 1 },
  quote: { fontStyle: 'italic' },
  strong: { fontWeight: '700' },
  centred: { textAlign: 'center' },
  footer: { paddingHorizontal: Sizing.screenPadding, paddingTop: Spacing[3], gap: Spacing[3] },
  accept: { height: OfferHero.acceptHeight },
  decline: { textAlign: 'center', fontWeight: '600', paddingVertical: Spacing[2] },
  goneCard: { alignItems: 'center', gap: Spacing[3] },
  others: { gap: Spacing[2] },
  other: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4] },
  otherCopy: { flex: 1, gap: Spacing[1] / 2 },
  spacer: { flex: 1 },
});
