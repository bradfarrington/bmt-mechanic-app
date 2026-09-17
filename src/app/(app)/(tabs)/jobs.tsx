import { Wrench } from 'lucide-react-native';

import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/ui';

export default function JobsScreen() {
  return (
    <Screen title="Jobs" back={false}>
      <Placeholder icon={Wrench} mockup="03 · Active job" title="Your schedule lands here">
        Upcoming and past jobs, each opening into confirmed, en route, in progress and completed.
      </Placeholder>
    </Screen>
  );
}
