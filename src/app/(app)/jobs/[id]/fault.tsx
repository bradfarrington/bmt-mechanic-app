import { useLocalSearchParams, useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Input, Notice, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { addFault } from '@/lib/job';

const SEVERITIES = [
  { key: 'advisory', label: 'Advisory', hint: 'Worth knowing about. Not urgent.' },
  { key: 'urgent', label: 'Urgent', hint: 'Needs sorting soon — a safety or breakdown risk.' },
] as const;

/** Note something found on the car. The customer sees it, and it can be turned into a quote. */
export default function FaultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'advisory' | 'urgent'>('advisory');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    setError(null);

    const result = await addFault(id, { description: description.trim(), severity });
    setSaving(false);

    if (result.ok) router.back();
    else setError(result.error);
  }

  return (
    <Screen
      title="Note a fault"
      avoidKeyboard
      footer={
        <Button fullWidth size="xl" loading={saving} disabled={!description.trim()} onPress={onSave}>
          Save fault
        </Button>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">What did you spot?</Text>
        <Text color="textSecondary">
          It goes on the job for the customer to see. You can quote for fixing it afterwards.
        </Text>
      </View>

      <Input
        label="The fault"
        value={description}
        onChangeText={setDescription}
        placeholder="Offside rear tyre is down to 2mm on the inner edge."
        rows={3}
        maxLength={500}
      />

      <View style={styles.options}>
        {SEVERITIES.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setSeverity(option.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: severity === option.key }}
            style={styles.option}
          >
            <Card selected={severity === option.key} style={styles.optionCard}>
              <Text style={styles.strong}>{option.label}</Text>
              <Text variant="caption" color="textSecondary">
                {option.hint}
              </Text>
            </Card>
          </Pressable>
        ))}
      </View>

      {!!error && (
        <Notice icon={TriangleAlert} tone="danger" title="That didn’t save">
          {error}
        </Notice>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  options: { flexDirection: 'row', gap: Spacing[2] },
  option: { flex: 1 },
  optionCard: { flex: 1, gap: Spacing[1], padding: Spacing[4] },
  strong: { fontWeight: '700' },
});
