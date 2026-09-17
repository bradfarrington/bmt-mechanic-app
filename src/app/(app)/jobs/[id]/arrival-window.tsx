import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarClock, CircleCheck, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button, Notice, Overline, Screen, Text } from '@/components/ui';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { fetchArrivalWindows, setArrivalWindow, type ArrivalDay } from '@/lib/offers';

/**
 * Straight after accepting an all-day or flexible job: tell the customer which
 * two hours to expect you in. The days and windows are the CRM's — it knows
 * the mechanic's hours and what else is in their diary.
 *
 * Skippable, because the job is already theirs; but it can only be set once.
 */
export default function ArrivalWindowScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [days, setDays] = useState<ArrivalDay[] | null>(null);
  const [alreadySet, setAlreadySet] = useState(false);
  const [picked, setPicked] = useState<{ dayKey: string; window: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    fetchArrivalWindows(id).then((result) => {
      if (!active) return;
      if (!result.ok) setError(result.error);
      else if (!result.needsArrivalWindow) setAlreadySet(true);
      else setDays(result.days);
    });

    return () => {
      active = false;
    };
  }, [id]);

  const done = () => router.replace('/jobs');

  async function onConfirm() {
    if (!picked) return;
    setSaving(true);
    setError(null);

    const result = await setArrivalWindow(id, picked);
    setSaving(false);

    if (result.ok) done();
    else setError(result.error);
  }

  return (
    <Screen
      title="Arrival window"
      back={false}
      footer={
        alreadySet ? (
          <Button fullWidth size="xl" onPress={done}>
            Go to my jobs
          </Button>
        ) : (
          <View style={styles.actions}>
            <Button fullWidth size="xl" loading={saving} disabled={!picked} onPress={onConfirm}>
              Confirm window
            </Button>
            <Button fullWidth variant="ghost" disabled={saving} onPress={done}>
              Decide later
            </Button>
          </View>
        )
      }
    >
      <Notice icon={CircleCheck} tone="success" title="Job accepted">
        It’s yours. The customer has been told.
      </Notice>

      {alreadySet ? (
        <Text color="textSecondary">This job already has its arrival window.</Text>
      ) : (
        <View style={styles.intro}>
          <Text variant="h1">When will you arrive?</Text>
          <Text color="textSecondary">
            The customer is free all day. Pick the two hours you’ll turn up in — it can only be
            set once.
          </Text>
        </View>
      )}

      {!!error && (
        <Notice icon={TriangleAlert} tone="danger" title="That didn’t work">
          {error}
        </Notice>
      )}

      {!days && !error && !alreadySet && <ActivityIndicator color={Palette.blue} />}

      {days?.map((day) => (
        <View key={day.dayKey} style={styles.day}>
          <View style={styles.dayHead}>
            <Overline>{day.label}</Overline>
            {day.dayOff && (
              <Text variant="caption" color="textMuted">
                Your day off
              </Text>
            )}
          </View>

          {!day.anySelectable && (
            <Text variant="caption" color="textMuted">
              Nothing free on this day.
            </Text>
          )}

          <View style={styles.options}>
            {day.options.map((option) => {
              const on = picked?.dayKey === day.dayKey && picked.window === option.window;
              return (
                <Pressable
                  key={option.window}
                  disabled={!option.selectable}
                  onPress={() => setPicked({ dayKey: day.dayKey, window: option.window })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on, disabled: !option.selectable }}
                  accessibilityLabel={`${day.label}, ${option.window}`}
                  style={[
                    styles.option,
                    on && styles.optionOn,
                    !option.selectable && styles.optionOff,
                  ]}
                >
                  <Text
                    variant="tileTitle"
                    color={on ? 'blueDark' : option.selectable ? 'textPrimary' : 'textDisabled'}
                  >
                    {option.window}
                  </Text>
                  {option.clash ? (
                    <Text variant="caption" color="textDisabled">
                      Clashes with #{option.clash.jobNumber}
                    </Text>
                  ) : option.outsideHours && option.selectable ? (
                    <Text variant="caption" color="textMuted">
                      Outside your hours
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {days?.length === 0 && (
        <Notice icon={CalendarClock} title="No windows to pick from">
          Set it from the job once you know your day.
        </Notice>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  actions: { gap: Spacing[2] },
  day: { gap: Spacing[2] },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  option: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: Spacing[1] / 2,
    padding: Spacing[3],
    borderRadius: Radius.tile,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceCard,
  },
  optionOn: { borderColor: Palette.blue, backgroundColor: Palette.blueTint },
  optionOff: { backgroundColor: Palette.surface },
});
