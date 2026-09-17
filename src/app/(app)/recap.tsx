import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Calendar, ChevronRight, PartyPopper, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, IconTile, Text } from '@/components/ui';
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
import { useAuth } from '@/lib/auth';
import { loadDay, tomorrowKey, type Job } from '@/lib/jobs';
import { dayInstant, formatDay, londonDayKey } from '@/lib/london-time';
import { formatPence } from '@/lib/offers';
import { useStatus } from '@/lib/status';
import { fetchSummary, formatMinutes, type DaySummary } from '@/lib/summary';

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text variant="bodySm" color={OnDark.textStrong}>
        {label}
      </Text>
      <Text color="textInverse" style={styles.strong}>
        {value}
      </Text>
    </View>
  );
}

/** End of day — opened by the push that follows the day's last completed job. */
export default function RecapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mechanic, firstName } = useAuth();
  const { status, goOffline } = useStatus();
  const params = useLocalSearchParams<{ day?: string }>();
  const day = params.day && dayInstant(params.day) ? params.day : londonDayKey(new Date());
  const mechanicId = mechanic?.id;

  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [tomorrow, setTomorrow] = useState<Job[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mechanicId) return;
    let active = true;

    Promise.all([fetchSummary(day), loadDay(mechanicId, tomorrowKey())]).then(([result, next]) => {
      if (!active) return;
      if (result.ok) setSummary(result.summary);
      else setError(result.error);
      if (next.ok) setTomorrow(next.jobs);
    });

    return () => {
      active = false;
    };
  }, [mechanicId, day]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/today'));

  const totals = summary?.totals;
  const goal = mechanic?.daily_goal_pence ?? null;
  const hitGoal = !!goal && !!totals && totals.earnedPence >= goal;
  const tomorrowPence = (tomorrow ?? []).reduce(
    (sum, job) => sum + (job.mechanic_payout_pence ?? 0),
    0,
  );
  const at = dayInstant(day);

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
        {!!at && (
          <Text variant="caption" color={OnDark.cardText}>
            {formatDay(at)}
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroTile}>
          <Icon
            icon={PartyPopper}
            size={OfferHero.glyph}
            strokeWidth={2}
            color={Palette.textInverse}
          />
        </View>
        <View style={styles.intro}>
          <Text variant="h1" color="textInverse">
            Job well done{firstName ? `, ${firstName}` : ''}.
          </Text>
          <Text variant="bodyLg" color={OnDark.textStrong}>
            {hitGoal ? 'You hit your goal — nice one.' : 'That’s the day’s work finished.'}
          </Text>
        </View>

        {!summary && !error && <ActivityIndicator color={Palette.textInverse} />}
        {!!error && <Text color={OnDark.textStrong}>{error}</Text>}

        {totals && (
          <View style={styles.panel}>
            <View style={styles.headline}>
              <View>
                <Text variant="caption" color={OnDark.cardText}>
                  You earned today
                </Text>
                <Text variant="display" color="textInverse">
                  {formatPence(totals.earnedPence)}
                </Text>
              </View>
              {!!goal && (
                <View style={styles.goal}>
                  <Text variant="caption" color={OnDark.cardText}>
                    Goal
                  </Text>
                  <Text color="textInverse" style={styles.strong}>
                    {formatPence(goal)}
                    {hitGoal ? ' ✓' : ''}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.divider} />
            <Line label="Jobs completed" value={String(totals.completedJobs)} />
            <Line label="Hours worked" value={formatMinutes(totals.workedMinutes)} />
            {totals.distanceMiles != null && (
              <Line label="Distance" value={`${Math.round(totals.distanceMiles)} mi`} />
            )}
            {totals.completedJobs > 0 && (
              <Line
                label="Avg per job"
                value={formatPence(Math.round(totals.earnedPence / totals.completedJobs))}
              />
            )}
          </View>
        )}

        {tomorrow && tomorrow.length > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/tomorrow')}
            style={[styles.panel, styles.row]}
          >
            <IconTile icon={Calendar} tone="onDark" />
            <View style={styles.grow}>
              <Text color="textInverse" style={styles.strong}>
                Tomorrow: {tomorrow.length} {tomorrow.length === 1 ? 'job' : 'jobs'} ·{' '}
                {formatPence(tomorrowPence)}
              </Text>
              <Text variant="caption" color={OnDark.cardText}>
                See the running order and when to set off.
              </Text>
            </View>
            <Icon
              icon={ChevronRight}
              size={Sizing.rowChevron}
              strokeWidth={2}
              color={OnDark.cardText}
            />
          </Pressable>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[3] }]}>
        <Button fullWidth size="xl" variant="onDark" onPress={() => router.replace('/tomorrow')}>
          See tomorrow’s schedule
        </Button>
        <Button
          fullWidth
          variant="dark"
          onPress={() => {
            if (status === 'online') goOffline();
            close();
          }}
        >
          {status === 'online' ? 'Close and go offline' : 'Close'}
        </Button>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  content: { padding: Sizing.screenPadding, gap: Spacing[3] },
  heroTile: {
    width: OfferHero.tile,
    height: OfferHero.tile,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: OfferHero.tileRadius,
    backgroundColor: OnDark.fill,
  },
  intro: { gap: Spacing[2], marginBottom: Spacing[2] },
  panel: {
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: OnDark.fill,
    backgroundColor: OnDark.tile,
  },
  headline: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  goal: { alignItems: 'flex-end', gap: Spacing[1] },
  divider: { height: 1, backgroundColor: OnDark.fill },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1, gap: Spacing[1] / 2 },
  strong: { fontWeight: '700' },
  footer: { paddingHorizontal: Sizing.screenPadding, paddingTop: Spacing[3], gap: Spacing[2] },
});
