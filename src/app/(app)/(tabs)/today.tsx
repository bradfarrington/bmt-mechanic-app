import { useRouter } from 'expo-router';
import { Landmark, Sun } from 'lucide-react-native';

import { Placeholder } from '@/components/placeholder';
import { Button, Notice, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function TodayScreen() {
  const router = useRouter();
  const { mechanic, firstName } = useAuth();

  return (
    <Screen title={firstName ? `Hi, ${firstName}` : 'Today'} back={false}>
      {mechanic && !mechanic.stripe_payouts_enabled && (
        <Notice icon={Landmark} tone="warn" title="Connect your bank to go online">
          <Button size="sm" variant="dark" onPress={() => router.push('/payouts')}>
            Set up payouts
          </Button>
        </Notice>
      )}

      <Placeholder icon={Sun} mockup="02 · Today & offers" title="Your day lands here">
        Daily goal, what is up next and live offers — first to accept wins.
      </Placeholder>
    </Screen>
  );
}
