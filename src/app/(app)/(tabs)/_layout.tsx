import { Tabs } from 'expo-router/js-tabs';
import { MessageCircle, Sun, User, Wrench } from 'lucide-react-native';

import { TabBar, type TabItem } from '@/components/tab-bar';
import { Palette } from '@/constants/theme';

/**
 * The hub screens. Everything pushed from here — a job, an offer, earnings —
 * lives beside this group in `(app)`, so opening any of them covers the tab
 * bar rather than sitting above it.
 *
 * Today keeps the `today` route (URL `/today`) rather than becoming `index`:
 * the root `app/index.tsx` already owns `/`, and groups do not change a
 * route's URL, so the two would conflict.
 */
const TABS = [
  { name: 'today', label: 'Today', icon: Sun },
  { name: 'jobs', label: 'Jobs', icon: Wrench },
  { name: 'inbox', label: 'Inbox', icon: MessageCircle },
  { name: 'account', label: 'Account', icon: User },
] as const satisfies readonly TabItem[];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Palette.surface },
      }}
      tabBar={(props) => <TabBar {...props} items={TABS} />}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
