import { StyleSheet, View } from 'react-native';

import { Card, Pill, Text } from '@/components/ui';
import { OnDark, Sizing, Spacing } from '@/constants/theme';
import { jobDistrict, jobDuration, jobStartTime, jobVehicle, type Job } from '@/lib/jobs';
import { formatPence } from '@/lib/offers';

export interface JobRowProps {
  job: Job;
  /** "1.2 mi", from the CRM's day summary. */
  distance?: string | null;
  /** Marks the job they are heading to next. */
  next?: boolean;
  /** A glass card for the deep gradient — "Tomorrow at a glance". */
  onDark?: boolean;
}

/** One job in a day's running order: start time, what and where, and what it pays. */
export function JobRow({ job, distance, next = false, onDark = false }: JobRowProps) {
  const ink = onDark ? 'textInverse' : 'textPrimary';
  const faint = onDark ? OnDark.cardText : 'textMuted';
  const duration = jobDuration(job);

  return (
    <Card style={[styles.card, onDark && styles.onDark]}>
      <View style={styles.time}>
        <Text variant="jobTime" color={ink}>
          {jobStartTime(job)}
        </Text>
        {!!duration && (
          <Text variant="caption" color={faint}>
            {duration}
          </Text>
        )}
      </View>
      <View style={styles.copy}>
        <View style={styles.title}>
          {next && <Pill tone="active">Next</Pill>}
          <Text variant="bodySm" color={ink} style={styles.name} numberOfLines={1}>
            {job.repair_description ?? 'Repair'}
          </Text>
        </View>
        <Text variant="caption" color={faint} numberOfLines={1}>
          {[jobVehicle(job), jobDistrict(job), distance].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text color={ink} style={styles.strong}>
        {formatPence(job.mechanic_payout_pence)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4] },
  onDark: {
    backgroundColor: OnDark.tile,
    borderColor: OnDark.fill,
    shadowOpacity: 0,
    elevation: 0,
  },
  time: { width: Sizing.dayChip, gap: Spacing[1] / 2 },
  copy: { flex: 1, gap: Spacing[1] / 2 },
  title: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  name: { flexShrink: 1, fontWeight: '700' },
  strong: { fontWeight: '700' },
});
