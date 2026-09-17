import { useLocalSearchParams, useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EvidencePicker } from '@/components/evidence-picker';
import { Button, Card, Input, Notice, Overline, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { openDispute } from '@/lib/disputes';

/** The reasons a mechanic may raise — `MECHANIC_REASONS` in the CRM. A customer's are different. */
const REASONS = [
  { value: 'refused_signoff', label: 'Customer disputes that the work was done' },
  { value: 'abusive', label: 'Customer abusive' },
  { value: 'scope', label: 'Disputed scope of work' },
  { value: 'other', label: 'Other' },
] as const;

/** The CRM's minimum for a dispute's description. */
const MIN_CHARS = 30;

/**
 * Raise an issue about a job with the customer in the loop — a dispute. For
 * something that is between the mechanic and BMT only, it is Get help instead.
 */
export default function RaiseIssueScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSend() {
    if (!reason) return;
    setSending(true);
    setError(null);

    const result = await openDispute(bookingId, {
      reasonCategory: reason,
      description: description.trim(),
      photos,
    });
    setSending(false);

    if (result.ok) router.replace({ pathname: '/disputes/[id]', params: { id: result.disputeId } });
    else setError(result.error);
  }

  const short = MIN_CHARS - description.trim().length;

  return (
    <Screen
      title="Raise an issue"
      avoidKeyboard
      footer={
        <Button
          fullWidth
          size="xl"
          loading={sending}
          disabled={!reason || short > 0}
          onPress={onSend}
        >
          Raise the issue
        </Button>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">What’s gone wrong?</Text>
        <Text color="textSecondary">
          This opens a dispute on the job. The customer sees it and can reply, and Book My Tech
          steps in if you can’t sort it between you. A job can only ever have one.
        </Text>
      </View>

      <View style={styles.section}>
        <Overline>Reason</Overline>
        {REASONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setReason(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: reason === option.value }}
          >
            <Card selected={reason === option.value} style={styles.option}>
              <Text variant="bodySm" style={styles.strong}>
                {option.label}
              </Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <Input
        label="What happened?"
        value={description}
        onChangeText={setDescription}
        rows={4}
        maxLength={2000}
        helper={short > 0 ? `${short} more characters needed.` : undefined}
      />

      <View style={styles.section}>
        <Overline>Evidence — optional</Overline>
        <EvidencePicker kind="disputes" photos={photos} onChange={setPhotos} />
      </View>

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
  option: { padding: Spacing[4] },
  strong: { fontWeight: '700' },
});
