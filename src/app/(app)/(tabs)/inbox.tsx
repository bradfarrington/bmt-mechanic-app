import { useFocusEffect, useRouter } from 'expo-router';
import {
  Banknote,
  CalendarClock,
  CircleX,
  FileWarning,
  Inbox as InboxIcon,
  LifeBuoy,
  MessageCircle,
  ShieldAlert,
  Star,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { Card, IconTile, Notice, Overline, Pill, Screen, Text } from '@/components/ui';
import { Palette, Radius, Sizing, Spacing, type Tone } from '@/constants/theme';
import { markInboxAllRead, markInboxRead, type InboxItem, type InboxTab } from '@/lib/inbox';
import { useInbox } from '@/lib/inbox-state';
import { initials } from '@/lib/job';
import { hrefFor } from '@/lib/links';
import { formatDay, formatLondon, londonDayKey } from '@/lib/london-time';

const TABS: readonly { key: 'all' | InboxTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'messages', label: 'Messages' },
  { key: 'alerts', label: 'Alerts' },
  { key: 'bmt', label: 'BMT' },
];

const ICONS: Record<InboxItem['icon'], LucideIcon> = {
  message: MessageCircle,
  dispute: ShieldAlert,
  case: LifeBuoy,
  payout: Banknote,
  review: Star,
  document: FileWarning,
  calendar: CalendarClock,
  quote: Wrench,
  job: Wrench,
  cancelled: CircleX,
};

const TONES: Record<InboxItem['tone'], Tone> = {
  info: 'accent',
  danger: 'error',
  success: 'success',
  warning: 'pending',
  neutral: 'neutral',
};

const HOUR_MS = 60 * 60_000;

/** "2m", "3h" inside the last day; then the time, "Yesterday", or the date. */
function when(at: string, now: number) {
  const then = new Date(at);
  const age = now - then.getTime();
  if (age < HOUR_MS) return `${Math.max(1, Math.floor(age / 60_000))}m`;
  if (londonDayKey(then) === londonDayKey(new Date(now))) {
    return formatLondon(then, { hour: '2-digit', minute: '2-digit' });
  }
  if (londonDayKey(then) === londonDayKey(new Date(now - 24 * HOUR_MS))) return 'Yesterday';
  return formatDay(then);
}

/** "Now" for the last hour, then "Today", "Yesterday", "Earlier". */
function bucket(at: string, now: number) {
  const then = new Date(at);
  if (now - then.getTime() < HOUR_MS) return 'Now';
  if (londonDayKey(then) === londonDayKey(new Date(now))) return 'Today';
  if (londonDayKey(then) === londonDayKey(new Date(now - 24 * HOUR_MS))) return 'Yesterday';
  return 'Earlier';
}

export default function InboxScreen() {
  const router = useRouter();
  const { inbox, error, refresh, setUnreadCount, markLocally } = useInbox();

  const [tab, setTab] = useState<'all' | InboxTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  // As of the last refresh, so ages do not shift under the reader.
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
      void refresh().then(() => setNow(Date.now()));
    }, [refresh]),
  );

  async function open(item: InboxItem) {
    router.push(hrefFor(item.link));
    // A thread is read by opening it; everything else is read by tapping it.
    if (!item.unread || item.id.startsWith('thread:')) return;
    markLocally([item.id]);
    const result = await markInboxRead(item.id);
    if (result.ok) setUnreadCount(result.unreadCount);
  }

  async function onMarkAll() {
    markLocally('all');
    const result = await markInboxAllRead();
    if (result.ok) setUnreadCount(result.unreadCount);
  }

  const items = (inbox?.items ?? []).filter((item) => tab === 'all' || item.tab === tab);
  const groups: { label: string; items: InboxItem[] }[] = [];
  for (const item of items) {
    const label = bucket(item.at, now);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }

  const anyUnread = (inbox?.items ?? []).some(
    (item) => item.unread && !item.id.startsWith('thread:'),
  );

  return (
    <Screen
      title="Inbox"
      back={false}
      action={
        anyUnread ? (
          <Text
            variant="bodySm"
            color="blue"
            style={styles.strong}
            accessibilityRole="button"
            onPress={() => void onMarkAll()}
          >
            Mark all read
          </Text>
        ) : undefined
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await refresh();
            setNow(Date.now());
            setRefreshing(false);
          }}
          tintColor={Palette.blue}
        />
      }
    >
      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setTab(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === option.key }}
          >
            <Pill tone={tab === option.key ? 'dark' : 'neutral'}>{option.label}</Pill>
          </Pressable>
        ))}
        <View style={styles.grow} />
        <Pressable accessibilityRole="button" onPress={() => router.push('/cases')}>
          <Pill tone="outline">Get help</Pill>
        </Pressable>
      </View>

      {!inbox && !error && <ActivityIndicator color={Palette.blue} />}

      {!!error && !inbox && (
        <Notice icon={TriangleAlert} tone="danger" title="That didn’t load">
          {error}
        </Notice>
      )}

      {inbox && items.length === 0 && (
        <Card elevated style={styles.empty}>
          <IconTile icon={InboxIcon} tone="neutral" size="xl" />
          <Text color="textSecondary" style={styles.centred}>
            {tab === 'all'
              ? 'Nothing here yet. Messages from customers and updates on your jobs land here.'
              : 'Nothing under this tab.'}
          </Text>
        </Card>
      )}

      {groups.map((group) => (
        <View key={group.label} style={styles.section}>
          <Overline>{group.label}</Overline>
          {group.items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => void open(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.unread ? 'Unread. ' : ''}${item.title}. ${item.detail ?? ''}`}
            >
              <Card selected={item.unread && item.tab === 'messages'} style={styles.row}>
                {item.avatarName ? (
                  <View style={styles.avatar}>
                    <Text color="blueDark" style={styles.strong}>
                      {initials(item.avatarName)}
                    </Text>
                  </View>
                ) : (
                  <IconTile icon={ICONS[item.icon] ?? InboxIcon} tone={TONES[item.tone] ?? 'neutral'} />
                )}
                <View style={styles.copy}>
                  <View style={styles.titleRow}>
                    <Text variant="bodySm" style={[styles.strong, styles.shrink]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {when(item.at, now)}
                    </Text>
                  </View>
                  {!!item.detail && (
                    <Text variant="caption" color="textSecondary" numberOfLines={2}>
                      {item.detail}
                    </Text>
                  )}
                  {!!item.reference && (
                    <Text variant="monoSm" color={item.urgent ? 'danger' : 'textMuted'} numberOfLines={1}>
                      {item.reference}
                    </Text>
                  )}
                </View>
                {item.unread && (
                  <View style={[styles.dot, item.urgent && styles.dotUrgent]} />
                )}
              </Card>
            </Pressable>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  grow: { flex: 1 },
  section: { gap: Spacing[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4] },
  avatar: {
    width: Sizing.iconTile.md.box,
    height: Sizing.iconTile.md.box,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.inner,
    backgroundColor: Palette.blueTintStrong,
  },
  copy: { flex: 1, gap: Spacing[1] / 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing[2] },
  shrink: { flexShrink: 1 },
  strong: { fontWeight: '700' },
  dot: { width: Sizing.dot, height: Sizing.dot, borderRadius: Sizing.dot / 2, backgroundColor: Palette.blue },
  dotUrgent: { backgroundColor: Palette.danger },
  empty: { alignItems: 'center', gap: Spacing[3] },
  centred: { textAlign: 'center' },
});
