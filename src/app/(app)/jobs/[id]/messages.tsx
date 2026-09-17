import { useLocalSearchParams } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  StyleSheet,
} from 'react-native';

import { Card, IconTile, Pill, Screen, Text } from '@/components/ui';
import { ChatBubble, ChatComposer } from '@/components/ui/chat';
import { Chat, Palette, Radius, Sizing, Spacing } from '@/constants/theme';
import { initials, jobReference, loadJob } from '@/lib/job';
import { formatDay, formatLondon, londonDayKey } from '@/lib/london-time';
import {
  CANNED_REPLIES,
  CLOSED_STATUSES,
  fetchMessages,
  markMessagesRead,
  MAX_MESSAGE_CHARS,
  sendMessage,
  type Message,
} from '@/lib/messages';

/** `messages` is not in the realtime publication — poll, as the CRM does. */
const POLL_MS = 10_000;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Message the customer — the thread, with one-tap replies above the composer.
 * `draft` arrives from the job screen's quick replies, ready to send or edit.
 */
export default function MessagesScreen() {
  const { id, draft: initialDraft } = useLocalSearchParams<{ id: string; draft?: string }>();

  const [customer, setCustomer] = useState<string | null>(null);
  /** "BMT-04210 · Ford Focus" under the customer's name. */
  const [reference, setReference] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState(initialDraft ?? '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A promise, not an awaited async function: state is only written inside
  // the `.then`, so the effect below never sets state synchronously.
  const load = useCallback(() => {
    if (!id) return Promise.resolve();
    return fetchMessages(id).then((thread) => {
      setMessages(thread);
      setLoading(false);
      // Reading the thread is what clears the customer's unread messages.
      if (thread.some((message) => message.sender_role === 'customer' && !message.read_at)) {
        void markMessagesRead(id);
      }
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    loadJob(id).then((result) => {
      if (!active || !result.ok) return;
      const { booking } = result.job;
      setCustomer(booking.customer_name?.trim() || null);
      setReference(
        [jobReference(booking.job_number), [booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(' ')]
          .filter(Boolean)
          .join(' · '),
      );
      setClosed(CLOSED_STATUSES.includes(result.job.booking.status));
    });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    return () => {
      clearInterval(timer);
      foreground.remove();
    };
  }, [id, load]);

  async function send() {
    const body = draft.trim();
    if (!id || !body) return;
    setSending(true);
    setError(null);

    const result = await sendMessage(id, body);
    setSending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDraft('');
    void load();
  }

  const canSend = !sending && !!draft.trim() && draft.length <= MAX_MESSAGE_CHARS;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        title={customer ?? 'Messages'}
        titleContent={
          customer ? (
            <View style={styles.threadTitle}>
              <View style={styles.avatar}>
                <Text variant="bodySm" color="blueDark" style={styles.strong}>
                  {initials(customer)}
                </Text>
              </View>
              <View style={styles.threadName}>
                <Text variant="headerTitle" numberOfLines={1}>
                  {customer}
                </Text>
                {!!reference && (
                  <Text variant="monoSm" color="textMuted" numberOfLines={1}>
                    {reference}
                  </Text>
                )}
              </View>
            </View>
          ) : undefined
        }
        footerStyle={styles.composerBar}
        footer={
          closed ? (
            <Text variant="caption" color="textMuted" style={styles.centre}>
              This job has finished, so its messages are closed.
            </Text>
          ) : (
            <View style={styles.composer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.replies}
                style={styles.repliesBleed}
              >
                {CANNED_REPLIES.map((reply) => (
                  <Pressable key={reply} accessibilityRole="button" onPress={() => setDraft(reply)}>
                    <Pill tone={draft === reply ? 'outline' : 'neutral'} large>
                      {reply}
                    </Pill>
                  </Pressable>
                ))}
              </ScrollView>
              <ChatComposer
                value={draft}
                onChangeText={setDraft}
                onSend={() => void send()}
                placeholder="Type a message…"
                sending={sending}
                canSend={canSend}
                maxLength={MAX_MESSAGE_CHARS}
              />
            </View>
          )
        }
      >
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator color={Palette.blue} />
          </View>
        )}

        {!loading && !messages.length && (
          <Card elevated style={styles.empty}>
            <IconTile icon={MessageCircle} size="lg" />
            <Text variant="h4" style={styles.centre}>
              No messages yet
            </Text>
            <Text color="textSecondary" style={styles.centre}>
              Anything you send here also reaches the customer by text if they don&apos;t see it
              straight away.
            </Text>
          </Card>
        )}

        {/* A short thread sits at the bottom, by the composer. */}
        <View style={styles.flex} />

        {groupByDay(messages).map((group) => (
          <View key={group.key} style={styles.day}>
            <Text variant="caption" color="textMuted" style={styles.centre}>
              {group.label}
            </Text>
            {group.messages.map((message) => (
              <ChatBubble
                key={message.id}
                mine={message.sender_role === 'mechanic'}
                meta={metaFor(message, customer)}
              >
                {message.body}
              </ChatBubble>
            ))}
          </View>
        ))}

        {!!error && (
          <Text variant="caption" color="danger" style={styles.centre}>
            {error}
          </Text>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

/** "Hannah · 09:14" / "You · 09:15" — the day is on the group's heading. */
function metaFor(message: Message, customer: string | null) {
  const who =
    message.sender_role === 'mechanic'
      ? 'You'
      : message.sender_role === 'customer'
        ? customer?.split(/\s+/)[0] || 'Customer'
        : 'Book My Tech';
  const time = formatLondon(new Date(message.created_at), {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${who} · ${time}`;
}

/** Consecutive messages under one heading per London day: Today, Yesterday, then the date. */
function groupByDay(messages: Message[]) {
  const today = londonDayKey(new Date());
  const yesterday = londonDayKey(new Date(Date.now() - DAY_MS));
  const groups: { key: string; label: string; messages: Message[] }[] = [];

  for (const message of messages) {
    const at = new Date(message.created_at);
    const key = londonDayKey(at);
    const last = groups[groups.length - 1];

    if (last?.key === key) {
      last.messages.push(message);
    } else {
      const label = key === today ? 'Today' : key === yesterday ? 'Yesterday' : formatDay(at);
      groups.push({ key, label, messages: [message] });
    }
  }
  return groups;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { paddingVertical: Spacing[6] },
  centre: { textAlign: 'center' },
  empty: { alignItems: 'center', gap: Spacing[3] },
  day: { gap: Spacing[2] },
  threadTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  threadName: { flexShrink: 1 },
  avatar: {
    width: Chat.headerAvatar,
    height: Chat.headerAvatar,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.inner,
    backgroundColor: Palette.blueTintStrong,
  },
  strong: { fontWeight: '700' },
  composer: { gap: Spacing[2] },
  // The replies scroll edge to edge, past the footer's padding.
  repliesBleed: { marginHorizontal: -Sizing.screenPadding },
  replies: { gap: Spacing[2], paddingHorizontal: Sizing.screenPadding },
  composerBar: {
    backgroundColor: Palette.surfaceCard,
    borderTopColor: Palette.border,
  },
});
