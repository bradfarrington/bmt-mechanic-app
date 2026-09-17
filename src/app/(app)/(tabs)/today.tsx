import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { CircleCheck, Landmark, Power, TriangleAlert, Zap } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { Kpi, KpiRow } from '@/components/kpi';
import { OfferCard } from '@/components/offer-card';
import { PushPrompt } from '@/components/push-prompt';
import {
  Button,
  Card,
  Icon,
  IconTile,
  Notice,
  Overline,
  Pill,
  Screen,
  Text,
} from '@/components/ui';
import {
  BrandGradient,
  DetailSizing,
  OnDark,
  Palette,
  Radius,
  ReadyHero,
  Shadows,
  Sizing,
  Spacing,
} from '@/constants/theme';
import { useOfferActions } from '@/hooks/use-offer-actions';
import { useOffers } from '@/hooks/use-offers';
import { useAuth } from '@/lib/auth';
import {
  isOpen,
  jobDistrict,
  jobDuration,
  jobStartTime,
  jobVehicle,
  loadToday,
  type TodaySummary,
} from '@/lib/jobs';
import { formatLondon, londonParts } from '@/lib/london-time';
import { formatPence } from '@/lib/offers';
import { useStatus } from '@/lib/status';

function greeting(now: Date) {
  const { hour } = londonParts(now);
  return hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
}

export default function TodayScreen() {
  const router = useRouter();
  const { mechanic, firstName } = useAuth();
  const { status, pending, toggle } = useStatus();
  const mechanicId = mechanic?.id;

  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Offers only go to mechanics who are online; on a job they still arrive.
  const { offers, error: offersError, refresh: refreshOffers } = useOffers(
    status === 'online' || status === 'on_job',
  );

  const load = useCallback(async () => {
    if (!mechanicId) return;
    const result = await loadToday(mechanicId);
    if (result.ok) {
      setSummary(result.summary);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [mechanicId]);

  // On focus rather than on mount: accepting an offer changes the day.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const actions = useOfferActions({
    onSettled: () => {
      void refreshOffers();
      void load();
    },
  });

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([load(), refreshOffers()]);
    setRefreshing(false);
  }

  const now = new Date();
  const open = summary?.jobs.filter(isOpen) ?? [];
  const nextId = open[0]?.id;
  const locked = status === 'locked';

  const line = locked
    ? null
    : status === 'offline'
      ? 'You’re not taking offers.'
      : summary
        ? open.length === 0
          ? 'Nothing lined up yet today.'
          : `${open.length} ${open.length === 1 ? 'job' : 'jobs'} lined up · ${formatPence(summary.bookedPence)} booked`
        : null;

  return (
    <Screen
      title="Today"
      back={false}
      action={
        status === 'online' ? (
          <Pill tone="success" pulse style={styles.headerPill}>
            Online
          </Pill>
        ) : status === 'on_job' ? (
          <Pill tone="active" style={styles.headerPill}>
            On a job
          </Pill>
        ) : (
          <Pill tone="neutral" style={styles.headerPill}>
            Offline
          </Pill>
        )
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.blue} />
      }
    >
      {locked && (
        <Notice icon={Landmark} tone="warn" title="Connect your bank to be paid">
          You can’t go online until this is done.
        </Notice>
      )}

      <View style={styles.intro}>
        <Text variant="caption" color="textMuted">
          {formatLondon(now, { weekday: 'long', day: 'numeric', month: 'short' })}
        </Text>
        <Text variant="h1">
          {greeting(now)}
          {firstName ? `, ${firstName}` : ''}.
        </Text>
        {!!line && <Text color="textSecondary">{line}</Text>}
      </View>

      {locked && (
        <Card elevated style={styles.stack}>
          <View style={styles.row}>
            <IconTile icon={TriangleAlert} tone="pending" size="lg" />
            <View style={styles.grow}>
              <Text style={styles.strong}>Nearly there.</Text>
              <Text variant="caption" color="textSecondary">
                Set up payouts and you can go online. Takes about 5 minutes with Stripe.
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          {['Account approved', 'Availability set'].map((done) => (
            <View key={done} style={styles.check}>
              <Icon icon={CircleCheck} size={DetailSizing.rowIcon} strokeWidth={2} color={Palette.success} />
              <Text variant="bodySm">{done}</Text>
            </View>
          ))}
          <View style={styles.check}>
            <Icon icon={TriangleAlert} size={DetailSizing.rowIcon} strokeWidth={2} color={Palette.warning} />
            <Text variant="bodySm" color="warningText">
              Bank account · to do
            </Text>
          </View>
          <Button fullWidth size="lg" onPress={() => router.push('/payouts')}>
            Set up payouts
          </Button>
        </Card>
      )}

      {status === 'offline' && (
        <Card elevated style={styles.offline}>
          <View style={styles.offlineIcon}>
            <Icon icon={Power} size={ReadyHero.glyph} strokeWidth={2} color={Palette.textMuted} />
          </View>
          <Text variant="h3">You’re offline.</Text>
          <Text color="textSecondary" style={styles.centred}>
            Go online to start taking offers again. We won’t send anything through until you do.
          </Text>
          <Button fullWidth size="lg" variant="success" iconLeft={Power} loading={pending} onPress={toggle}>
            Go online
          </Button>
        </Card>
      )}

      {!locked && <PushPrompt reason="First to accept wins. A notification gets you there before anyone else." />}

      {offers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Overline>New offers</Overline>
            <View style={styles.hint}>
              <Icon icon={Zap} size={Sizing.dot + Spacing[1]} strokeWidth={2} color={Palette.warning} />
              <Text variant="caption" color="textMuted">
                First to accept wins
              </Text>
            </View>
          </View>
          {offers.map((offer) => (
            <OfferCard
              key={offer.offerId}
              offer={offer}
              busy={actions.busyFor(offer.offerId)}
              onOpen={() => router.push({ pathname: '/offer/[id]', params: { id: offer.offerId } })}
              onAccept={() => void actions.accept(offer.offerId)}
              onDecline={() => void actions.decline(offer.offerId)}
            />
          ))}
        </View>
      )}

      {!!offersError && offers.length === 0 && status === 'online' && (
        <Text variant="caption" color="textMuted">
          Couldn’t check for offers just now — trying again.
        </Text>
      )}

      {!locked && summary && (
        <LinearGradient
          colors={BrandGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Overline color={OnDark.cardText}>Booked today</Overline>
          <Text variant="amount" color="textInverse">
            {formatPence(summary.bookedPence)}
          </Text>
          <Text variant="caption" color={OnDark.link}>
            {summary.jobs.length === 0
              ? 'Accept an offer and it shows up here.'
              : `Across ${summary.jobs.length} ${summary.jobs.length === 1 ? 'job' : 'jobs'} · paid 24 hours after each one.`}
          </Text>
        </LinearGradient>
      )}

      {!!error && (
        <Notice icon={TriangleAlert} tone="danger" title="That didn’t load">
          {error}
        </Notice>
      )}

      {open.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Overline>Up next</Overline>
            <Text variant="caption" color="textMuted">
              {open.length} {open.length === 1 ? 'job' : 'jobs'}
            </Text>
          </View>
          {open.map((job) => (
            <Card key={job.id} style={styles.job}>
              <View style={styles.jobTime}>
                <Text variant="jobTime">{jobStartTime(job)}</Text>
                {!!jobDuration(job) && (
                  <Text variant="caption" color="textMuted">
                    {jobDuration(job)}
                  </Text>
                )}
              </View>
              <View style={styles.grow}>
                <View style={styles.jobTitle}>
                  {job.id === nextId && <Pill tone="active">Next</Pill>}
                  <Text variant="bodySm" style={[styles.strong, styles.shrink]} numberOfLines={1}>
                    {job.repair_description ?? 'Repair'}
                  </Text>
                </View>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {jobVehicle(job)} · {jobDistrict(job)}
                </Text>
              </View>
              <Text style={styles.strong}>{formatPence(job.mechanic_payout_pence)}</Text>
            </Card>
          ))}
        </View>
      )}

      {!locked && summary && mechanic && (
        <KpiRow>
          <Kpi label="This week" value={formatPence(summary.weekPence)} />
          <Kpi label="Jobs done" value={String(mechanic.job_count)} />
          <Kpi label="Rating" value={mechanic.rating > 0 ? mechanic.rating.toFixed(1) : '—'} />
        </KpiRow>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // A pill pins itself to the top of a row; the header centres its children.
  headerPill: { alignSelf: 'center' },
  intro: { gap: Spacing[1] / 2 },
  stack: { gap: Spacing[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  grow: { flex: 1, gap: Spacing[1] / 2 },
  shrink: { flexShrink: 1 },
  strong: { fontWeight: '700' },
  centred: { textAlign: 'center' },
  divider: { height: 1, backgroundColor: Palette.borderSubtle },
  check: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  offline: { alignItems: 'center', gap: Spacing[3] },
  offlineIcon: {
    width: ReadyHero.box,
    height: ReadyHero.box,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    backgroundColor: Palette.borderSubtle,
  },
  section: { gap: Spacing[2] },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  hero: { gap: Spacing[1], padding: Spacing[5], borderRadius: Radius.card, ...Shadows.hero },
  job: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4] },
  jobTime: { width: Sizing.dayChip, gap: Spacing[1] / 2 },
  jobTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
});
