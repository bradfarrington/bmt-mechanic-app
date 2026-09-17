import { MessageCircle } from 'lucide-react-native';

import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/ui';

export default function InboxScreen() {
  return (
    <Screen title="Inbox" back={false}>
      <Placeholder icon={MessageCircle} mockup="04 · Inbox & messages" title="Your inbox lands here">
        Customer messages and notifications in one feed, with cases and disputes.
      </Placeholder>
    </Screen>
  );
}
