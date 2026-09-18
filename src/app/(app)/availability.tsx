import { useRouter } from 'expo-router';
import { Check, CircleAlert, Minus, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Button, Card, IconTile, Notice, Overline, Screen, Slider, Text } from '@/components/ui';
import { Palette, Radius, Sizing, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  DAY_NAMES,
  loadWorkingWeek,
  RADIUS_MIN,
  updateServiceArea,
  updateSpecialisms,
  updateWorkingWeek,
  type WorkingDay,
} from '@/lib/mechanic';
import { SPECIALISMS } from '@/lib/specialisms';

/**
 * Availability — mockup frame 3. The three sections of first-run setup on one
 * page, each saved by the one Save button: service radius, working hours and
 * specialisms. All three are written direct under RLS, as the web's editor
 * does; the base postcode is BMT's to change and is only shown.
 */

/** The slider's far end. A wider radius set by BMT stretches it rather than being cut down. */
const SLIDER_MAX = 20;

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

function shift(time: string, by: number) {
  return toTime(Math.min(LAST_MINUTE, Math.max(0, toMinutes(time) + by)));
}

/** The CRM's default for a day with no row: weekdays on, 08:00–18:00. */
function defaultWeek(days: readonly WorkingDay[]): WorkingDay[] {
  return days.map((day) => ({
    ...day,
    isActive: day.dayOfWeek >= 1 && day.dayOfWeek <= 5,
    startTime: '08:00',
    endTime: '18:00',
  }));
}

export default function AvailabilityScreen() {
  const router = useRouter();
  const { mechanic, refreshMechanic } = useAuth();
  const mechanicId = mechanic?.id;

  const [radius, setRadius] = useState(mechanic?.service_radius_miles ?? 10);
  const [days, setDays] = useState<WorkingDay[] | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [picked, setPicked] = useState<readonly string[]>(mechanic?.specialisms ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    setSaved(false);
    setDays((current) => current?.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...change } : day)) ?? null);
  }

  function toggleSpecialism(slug: string) {
    setSaved(false);
    setPicked((current) => (current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]));
  }

  async function onSave() {
    if (!mechanicId || !days) return;
    setSaving(true);
    setError(null);

    for (const write of [
      () => updateServiceArea(mechanicId, { radiusMiles: radius }),
      () => updateWorkingWeek(mechanicId, days),
      () => updateSpecialisms(mechanicId, picked),
    ]) {
      const result = await write();
      if (!result.ok) {
        setError(result.error);
        setSaving(false);
        return;
      }
    }

    await refreshMechanic();
    setSaving(false);
    setSaved(true);
  }

  const max = Math.max(SLIDER_MAX, mechanic?.service_radius_miles ?? 0);
  const postcodeArea = mechanic?.base_postcode?.trim().split(/\s+/)[0];
  const pickedCount = SPECIALISMS.filter((s) => picked.includes(s.slug)).length;

  return (
    <Screen
      title="Availability"
      footer={
        <Button fullWidth size="xl" iconRight={Check} loading={saving} disabled={!days} onPress={onSave}>
          {saved ? 'Saved' : 'Save changes'}
        </Button>
      }
    >
      {!!error && (
        <Notice icon={CircleAlert} tone="danger" title="That didn’t save">
          {error}
        </Notice>
      )}

      <Card>
        <View style={styles.radiusHead}>
          <View style={styles.grow}>
            <Text variant="caption" color="textSecondary" style={styles.strong}>
              Service radius
            </Text>
            <Text variant="h4">
              {radius} mi{postcodeArea ? ` from ${postcodeArea}` : ''}
            </Text>
          </View>
        </View>
        <Slider
          value={radius}
          min={RADIUS_MIN}
          max={max}
          onChange={(value) => {
            setRadius(value);
            setSaved(false);
          }}
          accessibilityLabel="Service radius"
          formatValue={(miles) => `${miles} miles`}
        />
        <View style={styles.radiusScale}>
          <Text variant="caption" color="textMuted">
            {RADIUS_MIN} mi
          </Text>
          <Text variant="caption" color="textMuted">
            {max} mi
          </Text>
        </View>
        <Text variant="caption" color="textMuted">
          Jobs inside this radius are the ones we offer you. Your base postcode is set by Book My
          Tech; message support if you have moved.
        </Text>
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Overline>Working hours</Overline>
          {days && (
            <Pressable
              onPress={() => {
                setDays(defaultWeek(days));
                setSaved(false);
              }}
              accessibilityRole="button"
              hitSlop={Spacing[2]}
            >
              <Text variant="caption" color="blue" style={styles.strong}>
                Reset to defaults
              </Text>
            </Pressable>
          )}
        </View>

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
      </View>

      <View style={styles.section}>
        <Overline>{`Specialisms · ${pickedCount} picked`}</Overline>
        <View style={styles.grid}>
          {SPECIALISMS.map((specialism) => {
            const on = picked.includes(specialism.slug);
            return (
              <Pressable
                key={specialism.slug}
                onPress={() => toggleSpecialism(specialism.slug)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={specialism.name}
                style={[styles.tile, on && styles.tileOn]}
              >
                <IconTile icon={specialism.icon} size="sm" tone={on ? 'brand' : 'accent'} />
                <Text variant="caption" color={on ? 'blueDark' : 'textSecondary'} style={styles.tileLabel}>
                  {specialism.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text variant="caption" color="textMuted">
          What you&rsquo;re happiest taking on. It goes on your profile.
        </Text>
      </View>

      {router.canGoBack() && saved && (
        <Button fullWidth variant="ghost" onPress={() => router.back()}>
          Back to account
        </Button>
      )}
    </Screen>
  );
}

function TimeControl({
  label,
  day,
  value,
  onChange,
}: {
  label: string;
  day: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.time}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <View style={styles.timeRow}>
        <Button size="sm" variant="secondary" iconOnly round iconLeft={Minus} onPress={() => onChange(shift(value, -STEP_MINUTES))}>
          {`${day} ${label.toLowerCase()} earlier`}
        </Button>
        <Text style={styles.strong}>{value}</Text>
        <Button size="sm" variant="secondary" iconOnly round iconLeft={Plus} onPress={() => onChange(shift(value, STEP_MINUTES))}>
          {`${day} ${label.toLowerCase()} later`}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing[2] },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strong: { fontWeight: '700' },
  grow: { flex: 1, gap: Spacing[1] },

  radiusHead: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[2] },
  radiusScale: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing[2] },

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

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  tile: {
    flexBasis: '31%',
    alignItems: 'center',
    gap: Spacing[2],
    padding: Spacing[3],
    borderRadius: Radius.tile,
    borderWidth: 1.5,
    borderColor: Palette.border,
    backgroundColor: Palette.surfaceCard,
  },
  tileOn: { borderColor: Palette.blue, backgroundColor: Palette.blueTint },
  tileLabel: { textAlign: 'center', fontWeight: '700' },
});
