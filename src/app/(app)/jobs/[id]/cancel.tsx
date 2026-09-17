import { useLocalSearchParams, useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Input, Notice, Pill, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { cancelJob, fetchJobExtras } from '@/lib/job';

/** The CRM's list, used until its own copy arrives with the job. */
const REASONS = [
  'Vehicle or parts issue',
  'Scheduling clash',
  'Unwell',
  'Customer unreachable',
  'Outside my area',
  'Other',
];

/** Hand a confirmed job back. It is re-offered to other mechanics; the customer keeps their slot. */
export default function CancelJobScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [reasons, setReasons] = useState(REASONS);
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchJobExtras(id).then((result) => {
      if (active && result.ok && result.extras.cancelReasons.length > 0) {
        setReasons(result.extras.cancelReasons);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  async function onCancel() {
    if (!reason) return;
    setSaving(true);
    setError(null);

    const result = await cancelJob(id, reason, detail);
    setSaving(false);

    // The job is no longer theirs to look at — back to the schedule.
    if (result.ok) router.dismissTo('/jobs');
    else setError(result.error);
  }

  return (
    <Screen
      title="Cancel job"
      avoidKeyboard
      footer={
        <View style={styles.actions}>
          <Button
            fullWidth
            size="xl"
            variant="destructive"
            loading={saving}
            disabled={!reason}
            onPress={onCancel}
          >
            Cancel this job
          </Button>
          <Button fullWidth variant="ghost" disabled={saving} onPress={() => router.back()}>
            Keep it
          </Button>
        </View>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">Can’t make it?</Text>
        <Text color="textSecondary">
          We’ll offer the job to other mechanics straight away and tell the customer we’re finding
          a replacement. Cancelling often affects the offers you’re sent.
        </Text>
      </View>

      <View style={styles.chips}>
        {reasons.map((option) => (
          <Pressable
            key={option}
            onPress={() => setReason(option)}
            accessibilityRole="radio"
            accessibilityState={{ checked: reason === option }}
          >
            <Pill tone={reason === option ? 'dark' : 'neutral'} large>
              {option}
            </Pill>
          </Pressable>
        ))}
      </View>

      <Input
        label="Anything we should know?"
        optional
        value={detail}
        onChangeText={setDetail}
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
  actions: { gap: Spacing[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
});
