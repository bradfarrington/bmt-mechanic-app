import { useRouter } from 'expo-router';
import { ArrowRight, Minus, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Button, Card, Notice, Screen, Stepper, Text } from '@/components/ui';
import { Palette, Sizing, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  DAY_NAMES,
  loadWorkingWeek,
  SETUP_STEPS,
  updateWorkingWeek,
  type WorkingDay,
} from '@/lib/mechanic';

const STEP_MINUTES = 30;
const LAST_MINUTE = 24 * 60 - STEP_MINUTES;

function toMinutes(time: string) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Move a time by half an hour, kept inside the day. */
function shift(time: string, by: number) {
  return toTime(Math.min(LAST_MINUTE, Math.max(0, toMinutes(time) + by)));
}

interface TimeControlProps {
  label: string;
  day: string;
  value: string;
  onChange: (value: string) => void;
}

function TimeControl({ label, day, value, onChange }: TimeControlProps) {
  return (
    <View style={styles.time}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <View style={styles.timeRow}>
        <Button
          size="sm"
          variant="secondary"
          iconOnly
          round
          iconLeft={Minus}
          onPress={() => onChange(shift(value, -STEP_MINUTES))}
        >
          {`${day} ${label.toLowerCase()} earlier`}
        </Button>
        <Text style={styles.timeValue}>{value}</Text>
        <Button
          size="sm"
          variant="secondary"
          iconOnly
          round
          iconLeft={Plus}
          onPress={() => onChange(shift(value, STEP_MINUTES))}
        >
          {`${day} ${label.toLowerCase()} later`}
        </Button>
      </View>
    </View>
  );
}

export default function HoursScreen() {
  const router = useRouter();
  const { mechanic } = useAuth();
  const mechanicId = mechanic?.id;

  const [days, setDays] = useState<WorkingDay[] | null>(null);
  /** The day whose times are open for editing. */
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!mechanicId) return;
    let active = true;

    loadWorkingWeek(mechanicId).then((result) => {
      if (!active) return;
      if (result.ok) setDays(result.days);
      else setError(result.error);
    });

    return () => {
      active = false;
    };
  }, [mechanicId]);

  function patch(dayOfWeek: number, change: Partial<WorkingDay>) {
    setDays(
      (current) =>
        current?.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...change } : day)) ??
        null,
    );
  }

  async function onContinue() {
    if (!mechanicId || !days) return;
    setSaving(true);
    setError(null);

    const result = await updateWorkingWeek(mechanicId, days);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push('/specialisms');
  }

  return (
    <Screen
      title="Set up"
      belowHeader={<Stepper step={4} total={SETUP_STEPS} label="When you're around" />}
      footer={
        <Button
          fullWidth
          size="xl"
          iconRight={ArrowRight}
          loading={saving}
          disabled={!days}
          onPress={onContinue}
        >
          Continue
        </Button>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">When do you work?</Text>
        <Text color="textSecondary">
          We only offer you jobs during these hours. Toggle a day off and we&rsquo;ll skip it.
          Tap a day&rsquo;s hours to change them.
        </Text>
      </View>

      {!!error && (
        <Notice icon={ArrowRight} tone="danger" title="That didn’t work">
          {error}
        </Notice>
      )}

      {!days && !error && <ActivityIndicator color={Palette.blue} />}

      {days && (
        <Card padded={false}>
          {days.map((day, index) => {
            const name = DAY_NAMES[day.dayOfWeek];
            const open = editing === day.dayOfWeek && day.isActive;

            return (
              <View key={day.dayOfWeek} style={index > 0 && styles.divider}>
                <View style={styles.day}>
                  <Text variant="bodySm" style={styles.dayName}>
                    {name}
                  </Text>
                  <Pressable
                    style={styles.dayHours}
                    disabled={!day.isActive}
                    onPress={() => setEditing(open ? null : day.dayOfWeek)}
                    accessibilityRole="button"
                    accessibilityLabel={`Change ${name} hours`}
                    accessibilityState={{ expanded: open }}
                  >
                    <Text
                      variant="bodySm"
                      color={day.isActive ? (open ? 'blue' : 'textSecondary') : 'textDisabled'}
                    >
                      {day.isActive ? `${day.startTime} — ${day.endTime}` : 'Day off'}
                    </Text>
                  </Pressable>
                  <Switch
                    value={day.isActive}
                    onValueChange={(isActive) => patch(day.dayOfWeek, { isActive })}
                    trackColor={{ true: Palette.blue, false: Palette.textDisabled }}
                    accessibilityLabel={`Work on ${name}`}
                  />
                </View>

                {open && (
                  <View style={styles.times}>
                    <TimeControl
                      label="Start"
                      day={name}
                      value={day.startTime}
                      onChange={(startTime) => patch(day.dayOfWeek, { startTime })}
                    />
                    <TimeControl
                      label="Finish"
                      day={name}
                      value={day.endTime}
                      onChange={(endTime) => patch(day.dayOfWeek, { endTime })}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      )}

      <Text variant="caption" color="textMuted">
        You can change these any time in Availability.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  divider: { borderTopWidth: 1, borderTopColor: Palette.borderSubtle },
  day: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sizing.inputGap,
    paddingVertical: Spacing[2],
    paddingHorizontal: Sizing.compactPadding,
  },
  dayName: { width: Sizing.dayChip - Spacing[3], fontWeight: '700' },
  dayHours: { flex: 1, paddingVertical: Spacing[2] },
  times: {
    flexDirection: 'row',
    gap: Spacing[4],
    paddingHorizontal: Sizing.compactPadding,
    paddingBottom: Spacing[3],
  },
  time: { flex: 1, gap: Spacing[1] },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeValue: { fontWeight: '700' },
});
