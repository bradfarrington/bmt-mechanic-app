import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Calendar, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { JobRow } from '@/components/job-row';
import { Button, Icon, Text } from '@/components/ui';
import {
  BrandGradientDeep,
  DetailSizing,
  OnDark,
  Palette,
  Radius,
  Sizing,
  Spacing,
} from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { loadDay, tomorrowKey, type Job } from '@/lib/jobs';
import { dayInstant, formatDay, formatLondon } from '@/lib/london-time';
import { formatPence } from '@/lib/offers';
import { distanceFor, fetchSummary, type DaySummary } from '@/lib/summary';

/**
 * "Tomorrow at a glance" — opened by the evening push, and from the end-of-day
 * recap. `day` comes with the push; without one it is simply tomorrow.
 */
export default function TomorrowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mechanic } = useAuth();
  const params = useLocalSearchParams<{ day?: string }>();
  const day = params.day && dayInstant(params.day) ? params.day : tomorrowKey();
  const mechanicId = mechanic?.id;

  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [extras, setExtras] = useState<DaySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mechanicId) return;
    let active = true;

    Promise.all([loadDay(mechanicId, day), fetchSummary(day)]).then(([result, summary]) => {
      if (!active) return;
      if (summary.ok) setExtras(summary.summary);
      if (result.ok) setJobs(result.jobs);
      else setError(result.error);
    });

    return () => {
      active = false;
    };
  }, [mechanicId, day]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/today'));

  const total = (jobs ?? []).reduce((sum, job) => sum + (job.mechanic_payout_pence ?? 0), 0);
  const leaveBy = extras?.leaveBy
    ? `leave by ${formatLondon(new Date(extras.leaveBy.iso), { hour: '2-digit', minute: '2-digit' })}` +
      (extras.leaveBy.area ? ` for ${extras.leaveBy.area}` : '')
    : null;

  const at = dayInstant(day);

  return (
    <LinearGradient
      colors={BrandGradientDeep}
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
        <View style={styles.intro}>
          <Text variant="h1" color="textInverse">
            Tomorrow at a glance.
          </Text>
          {jobs && (
            <Text variant="bodyLg" color={OnDark.textStrong}>
              {jobs.length === 0
                ? 'Nothing booked yet. Stay online and offers will come through.'
                : [
                    `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'} booked`,
                    formatPence(total),
                    leaveBy,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
            </Text>
          )}
        </View>

        {!jobs && !error && <ActivityIndicator color={Palette.textInverse} />}
        {!!error && <Text color={OnDark.textStrong}>{error}</Text>}

        {jobs?.map((job) => (
          <JobRow key={job.id} job={job} distance={distanceFor(extras, job.id)} onDark />
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[3] }]}>
        <Button
          size="xl"
          variant="dark"
          iconLeft={Calendar}
          style={styles.grow}
          onPress={() => router.replace('/jobs')}
        >
          Open schedule
        </Button>
        <Button size="xl" variant="onDark" style={styles.grow} onPress={close}>
          Got it
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
  intro: { gap: Spacing[2], marginVertical: Spacing[3] },
  footer: {
    flexDirection: 'row',
    gap: Spacing[2],
    paddingHorizontal: Sizing.screenPadding,
    paddingTop: Spacing[3],
  },
  grow: { flex: 1 },
});
