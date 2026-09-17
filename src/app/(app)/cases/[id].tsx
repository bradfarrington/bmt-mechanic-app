import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { CircleCheck, TriangleAlert } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { Button, Card, Notice, Overline, Pill, Screen, Text } from '@/components/ui';
import { ChatBubble, ChatComposer } from '@/components/ui/chat';
import { JobPhotos, Palette, Radius, Spacing } from '@/constants/theme';
import {
  CASE_STATUS,
  closeCase,
  fetchCase,
  postCaseMessage,
  type CaseMessage,
  type HelpCase,
} from '@/lib/cases';
import { formatLondon } from '@/lib/london-time';
import { MAX_MESSAGE_CHARS } from '@/lib/messages';

const POLL_MS = 15_000;

/** One Get-help case: what was raised, BMT's resolution if there is one, and the thread between them. */
export default function CaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [helpCase, setHelpCase] = useState<HelpCase | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [missing, setMissing] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  // A promise, not an async function: state is only written inside the `.then`.
  const load = useCallback(
    () =>
      fetchCase(id).then((result) => {
        if (!result) {
          setMissing(true);
          return;
        }
        setHelpCase(result.helpCase);
        setMessages(result.messages);
      }),
    [id],
  );

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    return () => {
      clearInterval(timer);
      foreground.remove();
    };
  }, [load]);

  async function run(key: string, action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    if (busy) return false;
    setBusy(key);
    const result = await action();
    await load();
    setBusy(null);
    if (!result.ok) Alert.alert('That didn’t go through', result.error);
    return result.ok;
  }

  async function send() {
    const body = draft.trim();
    if (!body) return;
    if (await run('send', () => postCaseMessage(id, body))) setDraft('');
  }

  if (!helpCase) {
    return (
      <Screen title="Case">
        {missing ? (
          <Notice icon={TriangleAlert} tone="danger" title="That case isn’t there">
            It may have been removed, or it isn’t yours.
          </Notice>
        ) : (
          <ActivityIndicator color={Palette.blue} style={styles.loading} />
        )}
      </Screen>
    );
  }

  const status = CASE_STATUS[helpCase.status] ?? { label: helpCase.status, tone: 'neutral' as const };
  const open = helpCase.status === 'open' || helpCase.status === 'in_progress';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        title="Case"
        footerStyle={styles.composerBar}
        footer={
          open ? (
            <ChatComposer
              value={draft}
              onChangeText={setDraft}
              onSend={() => void send()}
              placeholder="Message Book My Tech…"
              sending={busy === 'send'}
              canSend={!busy && !!draft.trim()}
              maxLength={MAX_MESSAGE_CHARS}
            />
          ) : undefined
        }
      >
        <View style={styles.intro}>
          <Text variant="h2">{helpCase.reason_label}</Text>
          <View style={styles.line}>
            <Pill tone={status.tone}>{status.label}</Pill>
            <Text variant="caption" color="textMuted">
              Raised {formatLondon(new Date(helpCase.created_at), { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>

        <Card style={styles.stack}>
          <Text variant="caption" color="textSecondary" style={styles.strong}>
            What happened
          </Text>
          <Text color="textSecondary">{helpCase.description}</Text>
          {helpCase.photos.length > 0 && (
            <View style={styles.photos}>
              {helpCase.photos.map((url) => (
                <Image key={url} source={{ uri: url }} style={styles.photo} contentFit="cover" />
              ))}
            </View>
          )}
        </Card>

        {!!helpCase.resolution_note && (
          <Notice icon={CircleCheck} tone="success" title="Resolution">
            {helpCase.resolution_note}
          </Notice>
        )}

        <View style={styles.section}>
          <Overline>Thread with Book My Tech</Overline>
          {messages.length === 0 && (
            <Text variant="caption" color="textMuted">
              No messages yet. Book My Tech will reply here.
            </Text>
          )}
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              mine={message.sender_role === 'mechanic'}
              meta={`${message.sender_role === 'mechanic' ? 'You' : 'Book My Tech'} · ${formatLondon(new Date(message.created_at), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
            >
              {message.body}
            </ChatBubble>
          ))}
        </View>

        {open && (
          <Button
            variant="ghost"
            loading={busy === 'close'}
            disabled={busy !== null}
            onPress={() =>
              Alert.alert('Close this case?', 'Do this once it’s sorted. You can raise another any time.', [
                { text: 'Keep it open', style: 'cancel' },
                { text: 'Close case', onPress: () => void run('close', () => closeCase(id)) },
              ])
            }
          >
            Close case
          </Button>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { marginTop: Spacing[6] },
  intro: { gap: Spacing[2] },
  line: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  stack: { gap: Spacing[2], padding: Spacing[4] },
  section: { gap: Spacing[2] },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  photo: { width: JobPhotos.size, height: JobPhotos.size, borderRadius: Radius.tile },
  composerBar: { backgroundColor: Palette.surfaceCard, borderTopColor: Palette.border },
  strong: { fontWeight: '700' },
});
