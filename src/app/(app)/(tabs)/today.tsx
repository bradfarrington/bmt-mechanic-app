import { Sun } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Placeholder } from '@/components/placeholder';
import { Button, Card, Overline, Screen, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useStatus, type MechanicStatus } from '@/lib/status';

const STATES: readonly { status: MechanicStatus; label: string }[] = [
  { status: 'online', label: 'Online' },
  { status: 'offline', label: 'Offline' },
  { status: 'on_job', label: 'On a job' },
  { status: 'locked', label: 'Locked' },
];

export default function TodayScreen() {
  const { status, setStatus } = useStatus();

  return (
    <Screen title="Today" back={false}>
      <Placeholder icon={Sun} mockup="02 · Today & offers" title="Your day lands here">
        Daily goal, what is up next and live offers — first to accept wins.
      </Placeholder>

      {/* Shell only: "On a job" and "Locked" cannot be reached by tapping the button. */}
      <Card style={styles.preview}>
        <Overline>Status button preview</Overline>
        <Text color="textSecondary">
          Tap the centre button to go online or offline, or pick a state to see it.
        </Text>
        <View style={styles.states}>
          {STATES.map((state) => (
            <Button
              key={state.status}
              size="sm"
              variant={state.status === status ? 'primary' : 'secondary'}
              onPress={() => setStatus(state.status)}
            >
              {state.label}
            </Button>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { gap: Spacing[3] },
  states: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
});
