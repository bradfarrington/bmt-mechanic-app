import { useRouter } from 'expo-router';
import { ArrowRight, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Input, Screen, Slider, Stepper, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { RADIUS_MIN, SETUP_STEPS, updateServiceArea } from '@/lib/mechanic';

/** The slider's far end. A wider radius set by BMT stretches it rather than being cut down. */
const SLIDER_MAX = 20;

export default function ServiceAreaScreen() {
  const router = useRouter();
  const { mechanic, refreshMechanic } = useAuth();

  const storedPostcode = mechanic?.base_postcode?.trim() ?? '';
  const [postcode, setPostcode] = useState(storedPostcode);
  const [radius, setRadius] = useState(mechanic?.service_radius_miles ?? 10);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // BMT sets the base postcode from the application, and the web profile shows
  // it read-only. Only a mechanic without one gets to enter it here.
  const postcodeLocked = storedPostcode.length > 0;
  const max = Math.max(SLIDER_MAX, mechanic?.service_radius_miles ?? 0);

  async function onContinue() {
    if (!mechanic) return;
    setSaving(true);
    setError(null);

    const result = await updateServiceArea(mechanic.id, {
      radiusMiles: radius,
      basePostcode: postcodeLocked ? undefined : postcode,
    });
    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }

    await refreshMechanic();
    setSaving(false);
    router.push('/hours');
  }

  return (
    <Screen
      title="Set up"
      avoidKeyboard
      belowHeader={<Stepper step={3} total={SETUP_STEPS} label="Where you work" />}
      footer={
        <Button
          fullWidth
          size="xl"
          iconRight={ArrowRight}
          loading={saving}
          disabled={!postcodeLocked && postcode.trim().length < 2}
          onPress={onContinue}
        >
          Continue
        </Button>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">Where are you based?</Text>
        <Text color="textSecondary">
          Jobs within your radius are the ones we&rsquo;ll offer you.
        </Text>
      </View>

      <Input
        label="Base postcode"
        iconLeft={MapPin}
        value={postcode}
        onChangeText={setPostcode}
        editable={!postcodeLocked}
        placeholder="SE15 4EX"
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="postal-code"
        textContentType="postalCode"
        helper={
          postcodeLocked
            ? 'From your application. Message support if you have moved.'
            : undefined
        }
        error={error ?? undefined}
      />

      <View>
        <View style={styles.radiusLabel}>
          <Text variant="label" color="textSecondary">
            Service radius
          </Text>
          <Text color="blue" style={styles.radiusValue}>
            {radius} miles
          </Text>
        </View>
        <Slider
          value={radius}
          min={RADIUS_MIN}
          max={max}
          onChange={setRadius}
          accessibilityLabel="Service radius"
          formatValue={(miles) => `${miles} miles`}
        />
        <View style={styles.radiusLabel}>
          <Text variant="caption" color="textMuted">
            {RADIUS_MIN} mi
          </Text>
          <Text variant="caption" color="textMuted">
            {max} mi
          </Text>
        </View>
      </View>

      <Text variant="caption" color="textMuted">
        You can change this later in Availability.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  radiusLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radiusValue: { fontWeight: '700' },
});
