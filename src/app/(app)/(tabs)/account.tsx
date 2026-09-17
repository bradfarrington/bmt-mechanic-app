import { User } from 'lucide-react-native';

import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/ui';

export default function AccountScreen() {
  return (
    <Screen title="Account" back={false}>
      <Placeholder icon={User} mockup="05 · Account & earnings" title="Your account lands here">
        Earnings and payouts, availability, documents, profile, reviews, Pro and help.
      </Placeholder>
    </Screen>
  );
}
