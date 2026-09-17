import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Icon, Pill, Text } from '@/components/ui';
import { OnDark, Palette, Sizing, Spacing } from '@/constants/theme';
import {
  customerShortName,
  isOpen,
  jobDistrict,
  jobDuration,
  jobStartTime,
  jobStatusMeta,
  jobVehicle,
  type Job,
} from '@/lib/jobs';
import { formatDay } from '@/lib/london-time';
import { formatPence } from '@/lib/offers';

export interface JobRowProps {
  job: Job;
  /** "1.2 mi", from the CRM's day summary. */
  distance?: string | null;
  /** Marks the job they are heading to next. */
  next?: boolean;
  /** A glass card for the deep gradient — "Tomorrow at a glance". */
  onDark?: boolean;
  /**
   * The schedule's fuller row: a status pill, the customer in place of the
   * vehicle, the pay on the caption line and a chevron — and the day above the
   * time, for a list that spans more than one.
   */
  schedule?: boolean;
  showDay?: boolean;
  onPress?: () => void;
}

/** One job in a day's running order: start time, what and where, and what it pays. */
export function JobRow({
  job,
  distance,
  next = false,
  onDark = false,
  schedule = false,
  showDay = false,
  onPress,
}: JobRowProps) {
  const ink = onDark ? 'textInverse' : 'textPrimary';
  const faint = onDark ? OnDark.cardText : 'textMuted';
  const duration = jobDuration(job);
  const status = jobStatusMeta(job.status);
  const pay = formatPence(job.mechanic_payout_pence);
  // The job under way is the one the schedule picks out.
  const live = schedule && (job.status === 'en_route' || job.status === 'in_progress');

  const caption = schedule
    ? [
        customerShortName(job) ?? jobVehicle(job),
        jobDistrict(job),
        distance,
        pay,
        job.status === 'completed' ? 'Paid' : null,
      ]
    : [jobVehicle(job), jobDistrict(job), distance];

  const row = (
    <Card selected={live} style={[styles.card, onDark && styles.onDark]}>
      <View style={styles.time}>
        {showDay && !!job.scheduled_at && (
          <Text variant="caption" color={faint}>
            {formatDay(new Date(job.scheduled_at))}
          </Text>
        )}
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
          {schedule && (
            <Pill tone={status.tone} pulse={status.live && isOpen(job)}>
              {status.label}
            </Pill>
          )}
          <Text variant="bodySm" color={ink} style={styles.name} numberOfLines={1}>
            {job.repair_description ?? 'Repair'}
          </Text>
        </View>
        <Text variant="caption" color={faint} numberOfLines={1}>
          {caption.filter(Boolean).join(' · ')}
        </Text>
      </View>
      {schedule ? (
        <Icon icon={ChevronRight} size={Sizing.rowChevron} strokeWidth={2} color={Palette.textMuted} />
      ) : (
        <Text color={ink} style={styles.strong}>
          {pay}
        </Text>
      )}
    </Card>
  );

  if (!onPress) return row;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${job.repair_description ?? 'Repair'}, ${status.label}, ${jobStartTime(job)}`}
    >
      {row}
    </Pressable>
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
  time: { minWidth: Sizing.dayChip, gap: Spacing[1] / 2 },
  copy: { flex: 1, gap: Spacing[1] / 2 },
  title: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  name: { flexShrink: 1, fontWeight: '700' },
  strong: { fontWeight: '700' },
});
