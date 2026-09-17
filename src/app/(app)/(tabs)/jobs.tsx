import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarX, TriangleAlert } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { JobRow } from '@/components/job-row';
import { Card, IconTile, Notice, Overline, Pill, Screen, Text } from '@/components/ui';
import { Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { isOpen, loadJobs, type Job, type JobRange } from '@/lib/jobs';
import { distanceFor, fetchSummary, type DaySummary } from '@/lib/summary';

const RANGES: readonly { key: JobRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'past', label: 'Past' },
];

const EMPTY: Record<JobRange, string> = {
  today: 'Nothing booked for today. Accept an offer and it lands here.',
  week: 'Nothing booked this week yet.',
  past: 'Jobs you finish show up here.',
};

export default function JobsScreen() {
  const router = useRouter();
  const { mechanic } = useAuth();
  const mechanicId = mechanic?.id;

  const [range, setRange] = useState<JobRange>('today');
  const [jobs, setJobs] = useState<Job[] | null>(null);
  // Distances come by the day, so only Today's rows carry one.
  const [extras, setExtras] = useState<DaySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!mechanicId) return;
    const [result, day] = await Promise.all([
      loadJobs(mechanicId, range),
      range === 'today' ? fetchSummary() : null,
    ]);
    setExtras(day?.ok ? day.summary : null);
    if (result.ok) {
      setJobs(result.jobs);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [mechanicId, range]);

  // On focus: a job's status changes on the screens pushed from here.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const open = (job: Job) => router.push({ pathname: '/jobs/[id]', params: { id: job.id } });

  const active = jobs?.filter(isOpen) ?? [];
  const done = jobs?.filter((job) => !isOpen(job)) ?? [];
  const showDay = range !== 'today';

  function section(title: string, rows: Job[]) {
    if (rows.length === 0) return null;
    return (
      <View style={styles.section}>
        <Overline>{title}</Overline>
        {rows.map((job) => (
          <JobRow
            key={job.id}
            job={job}
            schedule
            showDay={showDay}
            distance={distanceFor(extras, job.id)}
            onPress={() => open(job)}
          />
        ))}
      </View>
    );
  }

  return (
    <Screen
      title="Jobs"
      back={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.blue} />
      }
    >
      <View style={styles.ranges} accessibilityRole="tablist">
        {RANGES.map((item) => {
          const on = item.key === range;
          return (
            <Pressable
              key={item.key}
              onPress={() => {
                if (on) return;
                setJobs(null);
                setRange(item.key);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <Pill tone={on ? 'dark' : 'neutral'}>
                {on && item.key === 'today' && jobs ? `${item.label} · ${jobs.length}` : item.label}
              </Pill>
            </Pressable>
          );
        })}
      </View>

      {!!error && (
        <Notice icon={TriangleAlert} tone="danger" title="That didn’t load">
          {error}
        </Notice>
      )}

      {!jobs && !error && <ActivityIndicator color={Palette.blue} />}

      {range === 'past' ? section('Past jobs', done) : section('Active', active)}
      {range !== 'past' && section(range === 'today' ? 'Earlier today' : 'Done', done)}

      {jobs?.length === 0 && (
        <Card elevated style={styles.empty}>
          <IconTile icon={CalendarX} tone="neutral" size="xl" />
          <Text color="textSecondary" style={styles.centred}>
            {EMPTY[range]}
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ranges: { flexDirection: 'row', gap: Spacing[2] },
  section: { gap: Spacing[2] },
  empty: { alignItems: 'center', gap: Spacing[3] },
  centred: { textAlign: 'center' },
});
