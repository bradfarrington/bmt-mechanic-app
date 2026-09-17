import { useLocalSearchParams, useRouter } from 'expo-router';
import { Minus, Plus, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Input, Notice, Overline, Screen, Text } from '@/components/ui';
import { Palette, Radius, Sizing, Spacing } from '@/constants/theme';
import { proposeReschedule } from '@/lib/job';
import { formatLondon, londonInstant, londonParts } from '@/lib/london-time';

const DAYS_AHEAD = 14;
const STEP_MINUTES = 30;
const EARLIEST = 7 * 60;
const LATEST = 19 * 60;

/** London calendar days from today, as `{ year, month, day }` plus a noon instant to print from. */
function upcomingDays() {
  const { year, month, day } = londonParts(new Date());
  return Array.from({ length: DAYS_AHEAD }, (_, offset) => {
    const noon = londonInstant(year, month, day + offset, 12);
    return { ...londonParts(noon), noon, key: offset };
  });
}

/**
 * Propose a new time for a confirmed job. The booking keeps its slot until the
 * customer answers, and the job cannot be started while the proposal is open.
 */
export default function RescheduleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [days] = useState(upcomingDays);
  const [dayIndex, setDayIndex] = useState(1);
  const [minutes, setMinutes] = useState(9 * 60);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const day = days[dayIndex]!;
  // London wall-clock time, whatever zone the phone is in.
  const proposed = londonInstant(day.year, day.month, day.day, Math.floor(minutes / 60), minutes % 60);
  const clock = formatLondon(proposed, { hour: '2-digit', minute: '2-digit' });

  async function onPropose() {
    setSaving(true);
    setError(null);

    const result = await proposeReschedule(id, proposed.toISOString(), note.trim());
    setSaving(false);

    if (result.ok) router.back();
    else setError(result.error);
  }

  return (
    <Screen
      title="Propose new time"
      avoidKeyboard
      footer={
        <Button fullWidth size="xl" loading={saving} onPress={onPropose}>
          {`Propose ${formatLondon(proposed, { weekday: 'short', day: 'numeric', month: 'short' })} at ${clock}`}
        </Button>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">When suits instead?</Text>
        <Text color="textSecondary">
          The customer is asked to accept or decline. The job keeps its current time until they
          answer.
        </Text>
      </View>

      <View style={styles.section}>
        <Overline>Day</Overline>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bleed}
          contentContainerStyle={styles.days}
        >
          {days.map((option, index) => {
            const on = index === dayIndex;
            return (
              <Pressable
                key={option.key}
                onPress={() => setDayIndex(index)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={formatLondon(option.noon, { weekday: 'long', day: 'numeric', month: 'long' })}
                style={[styles.day, on && styles.dayOn]}
              >
                <Text variant="caption" color={on ? 'blueDark' : 'textMuted'}>
                  {index === 0 ? 'Today' : formatLondon(option.noon, { weekday: 'short' })}
                </Text>
                <Text variant="tileTitle" color={on ? 'blueDark' : 'textPrimary'}>
                  {option.day}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Overline>Arrival time</Overline>
        <Card style={styles.time}>
          <Button
            variant="secondary"
            iconOnly
            round
            iconLeft={Minus}
            disabled={minutes <= EARLIEST}
            onPress={() => setMinutes((m) => Math.max(EARLIEST, m - STEP_MINUTES))}
          >
            Earlier
          </Button>
          <Text variant="h2">{clock}</Text>
          <Button
            variant="secondary"
            iconOnly
            round
            iconLeft={Plus}
            disabled={minutes >= LATEST}
            onPress={() => setMinutes((m) => Math.min(LATEST, m + STEP_MINUTES))}
          >
            Later
          </Button>
        </Card>
      </View>

      <Input
        label="Note to the customer"
        optional
        value={note}
        onChangeText={setNote}
        placeholder="The parts arrive a day later than planned."
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
  bleed: { marginHorizontal: -Sizing.screenPadding },
  days: { gap: Spacing[2], paddingHorizontal: Sizing.screenPadding },
  day: {
    minWidth: Sizing.dayChip,
    alignItems: 'center',
    gap: Spacing[1] / 2,
    paddingVertical: Spacing[2],
    borderRadius: Radius.tile,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceCard,
  },
  dayOn: { borderColor: Palette.blue, backgroundColor: Palette.blueTint },
  time: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing[4] },
});
