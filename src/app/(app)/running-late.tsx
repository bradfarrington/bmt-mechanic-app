import { useRouter } from 'expo-router';
import { Check, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, Input, Notice, Overline, Pill, Screen, Text } from '@/components/ui';
import { DetailSizing, Palette, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { proposeReschedules } from '@/lib/job';
import { customerShortName, jobStartTime, loadJobs, type Job } from '@/lib/jobs';
import { formatLondon } from '@/lib/london-time';

/** The same four the website offers. */
const PUSHES = [
  { label: '30 min', minutes: 30 },
  { label: '1 h', minutes: 60 },
  { label: '2 h', minutes: 120 },
  { label: '3 h', minutes: 180 },
] as const;

const QUARTER_MS = 15 * 60_000;

/** A start time moved on and rounded up to the quarter hour, as the website does. */
function pushed(scheduledAt: string, minutes: number) {
  const moved = new Date(scheduledAt).getTime() + minutes * 60_000;
  return new Date(Math.ceil(moved / QUARTER_MS) * QUARTER_MS);
}

/**
 * Running late — propose a later time for the rest of today's jobs in one go.
 * Each customer is asked separately, and each job keeps its slot until they
 * answer. Only confirmed jobs can move; the one under way is not in the list.
 */
export default function RunningLateScreen() {
  const router = useRouter();
  const { mechanic } = useAuth();
  const mechanicId = mechanic?.id;

  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [minutes, setMinutes] = useState<number>(30);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ bookingId: string; error: string }[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!mechanicId) return;
    let active = true;

    loadJobs(mechanicId, 'today').then((result) => {
      if (!active) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const movable = result.jobs.filter(
        (job) => job.status === 'confirmed' && !!job.scheduled_at,
      );
      setJobs(movable);
      setPicked(movable.map((job) => job.id));
    });

    return () => {
      active = false;
    };
  }, [mechanicId]);

  async function onSend() {
    const items = (jobs ?? [])
      .filter((job) => picked.includes(job.id) && job.scheduled_at)
      .map((job) => ({ bookingId: job.id, newIso: pushed(job.scheduled_at!, minutes).toISOString() }));

    setSending(true);
    setError(null);
    const result = await proposeReschedules(items, note.trim());
    setSending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Everything moved: done. Otherwise stay, and say which did not and why.
    if (result.failed.length === 0) router.back();
    else {
      setFailed(result.failed);
      setPicked(result.failed.map((item) => item.bookingId));
    }
  }

  return (
    <Screen
      title="Running late"
      avoidKeyboard
      footer={
        <Button
          fullWidth
          size="xl"
          loading={sending}
          disabled={picked.length === 0}
          onPress={onSend}
        >
          {picked.length === 1 ? 'Propose 1 new time' : `Propose ${picked.length} new times`}
        </Button>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">Push back the rest of today.</Text>
        <Text color="textSecondary">
          Each customer is asked to accept the new time. A job keeps its slot until they answer.
        </Text>
      </View>

      <View style={styles.section}>
        <Overline>By how long?</Overline>
        <View style={styles.chips}>
          {PUSHES.map((option) => (
            <Pressable
              key={option.minutes}
              onPress={() => setMinutes(option.minutes)}
              accessibilityRole="radio"
              accessibilityState={{ checked: minutes === option.minutes }}
            >
              <Pill tone={minutes === option.minutes ? 'dark' : 'neutral'} large>
                {option.label}
              </Pill>
            </Pressable>
          ))}
        </View>
      </View>

      {!jobs && !error && <ActivityIndicator color={Palette.blue} />}

      {jobs?.length === 0 && (
        <Notice icon={Check} title="Nothing to move">
          You’ve no other confirmed jobs today.
        </Notice>
      )}

      {!!jobs?.length && (
        <View style={styles.section}>
          <Overline>Which jobs?</Overline>
          <Card padded={false}>
            {jobs.map((job, index) => {
              const on = picked.includes(job.id);
              const problem = failed.find((item) => item.bookingId === job.id)?.error;
              return (
                <Pressable
                  key={job.id}
                  onPress={() =>
                    setPicked((ids) => (on ? ids.filter((id) => id !== job.id) : [...ids, job.id]))
                  }
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={[styles.job, index > 0 && styles.divider]}
                >
                  <View style={[styles.box, on && styles.boxOn]}>
                    {on && (
                      <Icon icon={Check} size={DetailSizing.chipIcon} strokeWidth={3} color={Palette.textInverse} />
                    )}
                  </View>
                  <View style={styles.grow}>
                    <Text variant="bodySm" style={styles.strong} numberOfLines={1}>
                      {job.repair_description ?? 'Repair'}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {[customerShortName(job), `${jobStartTime(job)} → ${formatLondon(pushed(job.scheduled_at!, minutes), { hour: '2-digit', minute: '2-digit' })}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    {!!problem && (
                      <Text variant="caption" color="danger">
                        {problem}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </Card>
        </View>
      )}

      <Input
        label="Note to the customers"
        optional
        value={note}
        onChangeText={setNote}
        placeholder="The job before yours is taking longer than expected — sorry."
        rows={3}
        maxLength={500}
      />

      {!!error && (
        <Notice icon={TriangleAlert} tone="danger" title="That didn’t go through">
          {error}
        </Notice>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  section: { gap: Spacing[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  job: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  divider: { borderTopWidth: 1, borderTopColor: Palette.borderSubtle },
  box: {
    width: Spacing[5],
    height: Spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing[2],
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceCard,
  },
  boxOn: { borderColor: Palette.blue, backgroundColor: Palette.blue },
  grow: { flex: 1, gap: Spacing[1] / 2 },
  strong: { fontWeight: '700' },
});
