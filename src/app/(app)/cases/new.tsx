import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EvidencePicker } from '@/components/evidence-picker';
import { Button, Card, Input, Notice, Overline, Screen, Text } from '@/components/ui';
import { Palette, Radius, Sizing, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { fetchCaseReasons, MAX_CASE_CHARS, MIN_CASE_CHARS, openCase, type CaseReason } from '@/lib/cases';
import { jobReference } from '@/lib/job';
import { jobVehicle, loadJobs, type Job } from '@/lib/jobs';
import { formatDay } from '@/lib/london-time';

/**
 * Raise a case with Book My Tech about one of the mechanic's jobs — a payout
 * that looks wrong, a customer who wasn't there, a safety worry. It goes to
 * BMT, never to the customer. `bookingId` arrives when raised from a job.
 */
export default function NewCaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const { mechanic } = useAuth();
  const mechanicId = mechanic?.id;

  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [reasons, setReasons] = useState<CaseReason[] | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(params.bookingId ?? null);
  const [reasonId, setReasonId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!mechanicId) return;
    let active = true;

    // This week's jobs and the recent past: what a case is likely to be about.
    Promise.all([loadJobs(mechanicId, 'week'), loadJobs(mechanicId, 'past'), fetchCaseReasons()]).then(
      ([week, past, loaded]) => {
        if (!active) return;
        const all = [...(week.ok ? week.jobs : []), ...(past.ok ? past.jobs : [])];
        const unique = all.filter((job, index) => all.findIndex((o) => o.id === job.id) === index);
        unique.sort((a, b) => (b.scheduled_at ?? '').localeCompare(a.scheduled_at ?? ''));
        setJobs(unique);
        setReasons(loaded);
      },
    );

    return () => {
      active = false;
    };
  }, [mechanicId]);

  async function onSend() {
    if (!bookingId || !reasonId) return;
    setSending(true);
    setError(null);

    const result = await openCase({ bookingId, reasonId, description: description.trim(), photos });
    setSending(false);

    if (result.ok) router.replace({ pathname: '/cases/[id]', params: { id: result.caseId } });
    else setError(result.error);
  }

  const short = MIN_CASE_CHARS - description.trim().length;

  return (
    <Screen
      title="Raise a case"
      avoidKeyboard
      footer={
        <Button
          fullWidth
          size="xl"
          iconLeft={Send}
          loading={sending}
          disabled={!bookingId || !reasonId || short > 0}
          onPress={onSend}
        >
          Send to BMT ops
        </Button>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">What’s up?</Text>
        <Text color="textSecondary">
          This goes to BMT ops, not the customer. Payout issues, safety concerns, no-shows.
        </Text>
      </View>

      <View style={styles.section}>
        <Overline>Which job?</Overline>
        {!jobs && <ActivityIndicator color={Palette.blue} />}
        {jobs?.length === 0 && (
          <Text variant="caption" color="textMuted">
            You have no jobs to raise a case against yet.
          </Text>
        )}
        {!!jobs?.length && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
            contentContainerStyle={styles.jobs}
          >
            {jobs.map((job) => {
              const on = job.id === bookingId;
              return (
                <Pressable
                  key={job.id}
                  onPress={() => setBookingId(job.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={[styles.job, on && styles.jobOn]}
                >
                  <Text variant="monoSm" color={on ? 'blueDark' : 'textSecondary'}>
                    {jobReference(job.job_number)}
                  </Text>
                  <Text variant="bodySm" style={styles.strong} numberOfLines={1}>
                    {job.repair_description ?? 'Repair'}
                  </Text>
                  <Text variant="caption" color="textMuted" numberOfLines={1}>
                    {[jobVehicle(job), job.scheduled_at ? formatDay(new Date(job.scheduled_at)) : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <Overline>Reason</Overline>
        {reasons?.length === 0 && (
          <Text variant="caption" color="textMuted">
            No reasons are set up yet — Book My Tech needs to add some first.
          </Text>
        )}
        {reasons?.map((reason) => (
          <Pressable
            key={reason.id}
            onPress={() => setReasonId(reason.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: reasonId === reason.id }}
          >
            <Card selected={reasonId === reason.id} style={styles.option}>
              <Text variant="bodySm" style={styles.strong}>
                {reason.label}
              </Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <Input
        label="Tell us more"
        value={description}
        onChangeText={setDescription}
        rows={4}
        maxLength={MAX_CASE_CHARS}
        helper={short > 0 ? `${short} more characters needed.` : undefined}
      />

      <View style={styles.section}>
        <Overline>Attach evidence — optional</Overline>
        <EvidencePicker kind="cases" photos={photos} onChange={setPhotos} />
      </View>

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
  bleed: { marginHorizontal: -Sizing.screenPadding },
  jobs: { gap: Spacing[2], paddingHorizontal: Sizing.screenPadding },
  job: {
    width: Sizing.heroTile,
    gap: Spacing[1] / 2,
    padding: Spacing[3],
    borderRadius: Radius.tile,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceCard,
  },
  jobOn: { borderColor: Palette.blue, backgroundColor: Palette.blueTint },
  option: { padding: Spacing[4] },
  strong: { fontWeight: '700' },
});
