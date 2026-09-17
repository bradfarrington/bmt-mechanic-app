import { useRouter } from 'expo-router';
import { Check, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, IconTile, Notice, Screen, Stepper, Text } from '@/components/ui';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { SETUP_STEPS, updateSpecialisms } from '@/lib/mechanic';
import { SPECIALISMS } from '@/lib/specialisms';

export default function SpecialismsScreen() {
  const router = useRouter();
  const { mechanic, refreshMechanic } = useAuth();

  const [picked, setPicked] = useState<readonly string[]>(mechanic?.specialisms ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggle(slug: string) {
    setPicked((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug],
    );
  }

  async function onFinish() {
    if (!mechanic) return;
    setSaving(true);
    setError(null);

    const result = await updateSpecialisms(mechanic.id, picked);
    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }

    await refreshMechanic();
    setSaving(false);
    // Setup is over: `ready` replaces the wizard so Back cannot re-enter it.
    router.dismissAll();
    router.replace('/ready');
  }

  // Only the ones on offer here are counted; a slug from an older catalogue
  // stays saved but is not something they can see or unpick.
  const count = SPECIALISMS.filter((s) => picked.includes(s.slug)).length;

  return (
    <Screen
      title="Set up"
      belowHeader={<Stepper step={5} total={SETUP_STEPS} label="What you'll take on" />}
      footer={
        <Button fullWidth size="xl" iconRight={Check} loading={saving} onPress={onFinish}>
          Finish setup
        </Button>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">What do you fix?</Text>
        <Text color="textSecondary">
          Pick the work you&rsquo;re happiest taking on. It goes on your profile.
        </Text>
      </View>

      <View style={styles.grid}>
        {SPECIALISMS.map((specialism) => {
          const on = picked.includes(specialism.slug);
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
              <Text
                variant="caption"
                color={on ? 'blueDark' : 'textSecondary'}
                style={styles.tileLabel}
              >
                {specialism.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!!error && (
        <Notice icon={Sparkles} tone="danger" title="That didn’t work">
          {error}
        </Notice>
      )}

      <Notice
        icon={Sparkles}
        title={count === 1 ? '1 specialism picked' : `${count} specialisms picked`}
      >
        Add more later in Availability.
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  tile: {
    // Three across, less the two gaps between them.
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
