import { LogOut, User } from 'lucide-react-native';

import { Placeholder } from '@/components/placeholder';
import { Button, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function AccountScreen() {
  const { signOut } = useAuth();

  return (
    <Screen title="Account" back={false}>
      <Placeholder icon={User} mockup="05 · Account & earnings" title="Your account lands here">
        Earnings and payouts, availability, documents, profile, reviews, Pro and help.
      </Placeholder>

      <Button variant="ghost" iconLeft={LogOut} onPress={signOut}>
        Sign out
      </Button>
    </Screen>
  );
}
