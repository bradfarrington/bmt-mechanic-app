import { useRouter } from 'expo-router';
import { Target } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Notice, Screen, Slider, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { updateDailyGoal } from '@/lib/mechanic';
import { formatPence } from '@/lib/offers';

/** The slider's range — narrower than the £10–£2,000 the CRM allows, so it stays usable. */
const MIN_POUNDS = 50;
const MAX_POUNDS = 600;
const STEP_POUNDS = 10;
const DEFAULT_POUNDS = 200;

/** What they want to earn in a day. Today's ring fills towards it. */
export default function GoalScreen() {
  const router = useRouter();
  const { mechanic, refreshMechanic } = useAuth();

  const stored = mechanic?.daily_goal_pence ?? null;
  const [pounds, setPounds] = useState(stored ? Math.round(stored / 100) : DEFAULT_POUNDS);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<'save' | 'clear' | null>(null);

  async function save(goalPence: number | null) {
    if (!mechanic) return;
    setSaving(goalPence === null ? 'clear' : 'save');
    setError(null);

    const result = await updateDailyGoal(mechanic.id, goalPence);
    if (!result.ok) {
      setError(result.error);
      setSaving(null);
      return;
    }

    await refreshMechanic();
    setSaving(null);
    router.back();
  }

  return (
    <Screen
      title="Daily goal"
      footer={
        <View style={styles.actions}>
          <Button
            fullWidth
            size="xl"
            loading={saving === 'save'}
            disabled={saving !== null}
            onPress={() => void save(pounds * 100)}
          >
            {`Aim for ${formatPence(pounds * 100)} a day`}
          </Button>
          {stored !== null && (
            <Button
              fullWidth
              variant="ghost"
              loading={saving === 'clear'}
              disabled={saving !== null}
              onPress={() => void save(null)}
            >
              Remove my goal
            </Button>
          )}
        </View>
      }
    >
      <View style={styles.intro}>
        <Text variant="h1">What’s a good day?</Text>
        <Text color="textSecondary">
          Pick what you want to take home in a day, after commission. Today shows how close you
          are. It’s only for you — it doesn’t change which jobs you’re offered.
        </Text>
      </View>

      <View>
        <Text variant="amount" style={styles.amount}>
          {formatPence(pounds * 100)}
        </Text>
        <Slider
          value={pounds}
          min={MIN_POUNDS}
          max={Math.max(MAX_POUNDS, pounds)}
          step={STEP_POUNDS}
          onChange={setPounds}
          accessibilityLabel="Daily goal"
          formatValue={(value) => `${value} pounds`}
        />
        <View style={styles.range}>
          <Text variant="caption" color="textMuted">
            £{MIN_POUNDS}
          </Text>
          <Text variant="caption" color="textMuted">
            £{Math.max(MAX_POUNDS, pounds)}
          </Text>
        </View>
      </View>

      {!!error && (
        <Notice icon={Target} tone="danger" title="That didn’t save">
          {error}
        </Notice>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: Spacing[1] },
  actions: { gap: Spacing[2] },
  amount: { textAlign: 'center', marginBottom: Spacing[2] },
  range: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
