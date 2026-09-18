import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ApplyStep } from '@/components/apply-step';
import { IconTile, Slider, Text } from '@/components/ui';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { APPLY_RADIUS_MAX, APPLY_RADIUS_MIN, checkWork } from '@/lib/application';
import { useApplicationDraft } from '@/lib/application-draft';
import { SPECIALISMS } from '@/lib/specialisms';

/** Step 3 — what you work on, and how far you travel. The web's `step-specialisms.tsx`. */
export default function ApplyWorkScreen() {
  const router = useRouter();
  const { draft, update } = useApplicationDraft();
  const [error, setError] = useState<string | null>(null);

  function toggle(slug: string) {
    update({
      specialisms: draft.specialisms.includes(slug)
        ? draft.specialisms.filter((s) => s !== slug)
        : [...draft.specialisms, slug],
    });
  }

  function onContinue() {
    const problem = checkWork(draft);
    setError(problem);
    if (!problem) router.push('/apply/documents');
  }

  return (
    <ApplyStep
      step={3}
      heading="Your work."
      intro="What you work on, and how far you'll travel for a job."
      error={error}
      onContinue={onContinue}
    >
      <View style={styles.field}>
        <Text variant="label" color="textSecondary">
          What do you work on?
        </Text>
        <Text variant="caption" color="textMuted">
          Pick all that apply. They go on your profile.
        </Text>
        <View style={styles.grid}>
          {SPECIALISMS.map((specialism) => {
            const on = draft.specialisms.includes(specialism.slug);
            return (
              <Pressable
                key={specialism.slug}
                onPress={() => toggle(specialism.slug)}
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
      </View>

      <View style={styles.field}>
        <View style={styles.radiusHead}>
          <Text variant="label" color="textSecondary">
            Service radius
          </Text>
          <Text color="blue" style={styles.strong}>
            {draft.serviceRadiusMiles} miles
          </Text>
        </View>
        <Slider
          value={draft.serviceRadiusMiles}
          min={APPLY_RADIUS_MIN}
          max={APPLY_RADIUS_MAX}
          onChange={(serviceRadiusMiles) => update({ serviceRadiusMiles })}
          accessibilityLabel="Service radius"
          formatValue={(miles) => `${miles} miles`}
        />
        <View style={styles.radiusHead}>
          <Text variant="caption" color="textMuted">
            {APPLY_RADIUS_MIN} mi
          </Text>
          <Text variant="caption" color="textMuted">
            {APPLY_RADIUS_MAX} mi
          </Text>
        </View>
        <Text variant="caption" color="textMuted">
          How far from your base you&rsquo;ll travel for a job. You can change it once you&rsquo;re
          approved.
        </Text>
      </View>
    </ApplyStep>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing[2] },
  strong: { fontWeight: '700' },
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
  radiusHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
