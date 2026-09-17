import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Calendar,
  CircleCheck,
  Clock,
  Landmark,
  Power,
  Target,
  TriangleAlert,
  Zap,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { ChoiceList } from '@/components/choice-list';
import { GoalRing } from '@/components/goal-ring';
import { JobRow } from '@/components/job-row';
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
import { isOpen, loadToday, type TodaySummary } from '@/lib/jobs';
import { formatLondon, londonDayKey, londonParts } from '@/lib/london-time';
import { formatPence } from '@/lib/offers';
import { useStatus } from '@/lib/status';
import { distanceFor, fetchSummary, type DaySummary } from '@/lib/summary';

/** "at 14:30", or "tomorrow at 08:00" once it is no longer today in London. */
function formatResume(iso: string, now: Date) {
  const at = new Date(iso);
  const time = formatLondon(at, { hour: '2-digit', minute: '2-digit' });
  return londonDayKey(at) === londonDayKey(now)
    ? `at ${time}`
    : `${formatLondon(at, { weekday: 'long' })} at ${time}`;
}

function greeting(now: Date) {
  const { hour } = londonParts(now);
  return hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
}

export default function TodayScreen() {
  const router = useRouter();
  const { mechanic, firstName } = useAuth();
  const { status, pending, toggle, goOffline, resumeAt } = useStatus();
  const mechanicId = mechanic?.id;

  const [summary, setSummary] = useState<TodaySummary | null>(null);
  // Distances, accept rate and what has been earned — the CRM's half of the day.
  const [extras, setExtras] = useState<DaySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Offers only go to mechanics who are online; on a job they still arrive.
  const { offers, error: offersError, refresh: refreshOffers } = useOffers(
    status === 'online' || status === 'on_job',
  );

  const load = useCallback(async () => {
    if (!mechanicId) return;
    const [result, day] = await Promise.all([loadToday(mechanicId), fetchSummary()]);
    // Best effort: without it the rows lose their distances, nothing more.
    if (day.ok) setExtras(day.summary);
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

  const goal = mechanic?.daily_goal_pence ?? null;
  // The CRM's figure when it has answered; otherwise what the rows say is done.
  const earned =
    extras?.totals.earnedPence ??
    (summary?.jobs ?? [])
      .filter((job) => job.status === 'completed')
      .reduce((total, job) => total + (job.mechanic_payout_pence ?? 0), 0);
  const booked = summary?.bookedPence ?? 0;

  const goalHeadline = !goal
    ? 'Set a daily goal'
    : earned >= goal
      ? 'Goal hit — nice one'
      : `${formatPence(goal - earned)} to go`;
  const goalDetail = !goal
    ? `${formatPence(booked)} booked today. Tap to pick a target to aim for.`
    : earned >= goal
      ? `${formatPence(earned)} earned today.`
      : booked >= goal
        ? `On track — ${formatPence(booked)} is booked in. ${Math.round((earned / goal) * 100)}% there.`
        : `${formatPence(booked)} booked so far — ${formatPence(goal - booked)} short. Stay online for more offers.`;

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

      {status === 'offline' && (
        <View style={styles.section}>
          <Overline>{resumeAt ? 'Coming back online' : 'Or pick when'}</Overline>
          {!!resumeAt && (
            <Notice icon={Clock} title={`Back online ${formatResume(resumeAt, now)}`}>
              <Button size="sm" variant="secondary" disabled={pending} onPress={() => goOffline()}>
                Cancel
              </Button>
            </Notice>
          )}
          <ChoiceList
            disabled={pending}
            items={[
              {
                key: '30',
                icon: Clock,
                label: 'Come back online in 30 min',
                onPress: () => goOffline({ minutes: 30 }),
              },
              {
                key: '60',
                icon: Clock,
                label: 'Come back online in 1 hour',
                onPress: () => goOffline({ minutes: 60 }),
              },
              {
                key: 'shift',
                icon: Calendar,
                label: 'Come back at my next shift',
                onPress: () => goOffline({ at: 'next_shift' }),
              },
            ]}
          />
        </View>
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
        <Pressable
          onPress={() => router.push('/goal')}
          accessibilityRole="button"
          accessibilityLabel={goal ? 'Change your daily goal' : 'Set a daily goal'}
        >
          <LinearGradient
            colors={BrandGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {goal ? (
              <GoalRing earnedPence={earned} goalPence={goal} />
            ) : (
              <IconTile icon={Target} tone="onDark" size="xl" />
            )}
            <View style={styles.grow}>
              <Overline color={OnDark.cardText}>Daily goal</Overline>
              <Text variant="h4" color="textInverse">
                {goalHeadline}
              </Text>
              <Text variant="caption" color={OnDark.link}>
                {goalDetail}
              </Text>
            </View>
          </LinearGradient>
        </Pressable>
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
            <JobRow
              key={job.id}
              job={job}
              next={job.id === nextId}
              distance={distanceFor(extras, job.id)}
              onPress={() => router.push({ pathname: '/jobs/[id]', params: { id: job.id } })}
            />
          ))}
        </View>
      )}

      {!locked && summary && mechanic && (
        <KpiRow>
          <Kpi label="This week" value={formatPence(summary.weekPence)} />
          <Kpi
            label="Accept rate"
            value={extras?.acceptRate.percent != null ? `${extras.acceptRate.percent}%` : '—'}
          />
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    padding: Spacing[5],
    borderRadius: Radius.card,
    ...Shadows.hero,
  },
});
