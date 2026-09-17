import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, LifeBuoy, Lock, ShieldAlert, TriangleAlert } from 'lucide-react-native';
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

import { EvidencePicker } from '@/components/evidence-picker';
import { Button, Card, Icon, IconTile, Notice, Overline, Pill, Screen, Text } from '@/components/ui';
import { ChatBubble, ChatComposer } from '@/components/ui/chat';
import { DetailSizing, JobPhotos, Palette, Radius, Spacing, type Tone } from '@/constants/theme';
import {
  acceptRefund,
  escalateDispute,
  fetchDispute,
  fetchDisputeThread,
  offerRedo,
  sendDisputeMessage,
  timeLeft,
  withdrawDispute,
  type Dispute,
  type DisputeMessage,
} from '@/lib/disputes';
import { formatLondon } from '@/lib/london-time';
import { MAX_MESSAGE_CHARS } from '@/lib/messages';
import { formatPence } from '@/lib/offers';

/** The thread is not on Realtime — poll, as the website does. */
const POLL_MS = 10_000;

const STATUS_TONE: Record<Dispute['status'], Tone> = {
  opened: 'pending',
  responded: 'active',
  escalated: 'error',
  resolved: 'success',
  withdrawn: 'neutral',
};

const WHO: Record<DisputeMessage['sender_role'], string> = {
  customer: 'Customer',
  mechanic: 'You',
  admin: 'Book My Tech',
};

/**
 * A dispute on one of the mechanic's jobs — customer, mechanic and Book My
 * Tech in one thread. The mechanic can reply (with photos), offer to put it
 * right, accept the refund, or ask BMT to step in; BMT steps in by itself
 * after 48 hours. What each dispute allows comes from the CRM in `can`.
 */
export default function DisputeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [thread, setThread] = useState<DisputeMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [draft, setDraft] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [attaching, setAttaching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // A promise, not an async function: state is only written inside the `.then`.
  const load = useCallback(
    () =>
      Promise.all([fetchDispute(id), fetchDisputeThread(id)]).then(([result, messages]) => {
        setNow(Date.now());
        setThread(messages);
        if (result.ok) {
          setDispute(result.dispute);
          setError(null);
        } else {
          setError(result.error);
        }
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
    const sent = await run('send', () => sendDisputeMessage(id, body, photos));
    if (sent) {
      setDraft('');
      setPhotos([]);
      setAttaching(false);
    }
  }

  function confirm(title: string, message: string, label: string, action: () => void, destructive = false) {
    Alert.alert(title, message, [
      { text: 'Not yet', style: 'cancel' },
      { text: label, style: destructive ? 'destructive' : 'default', onPress: action },
    ]);
  }

  if (!dispute) {
    return (
      <Screen title="Dispute">
        {error ? (
          <Notice icon={TriangleAlert} tone="danger" title="That didn’t load">
            {error}
          </Notice>
        ) : (
          <ActivityIndicator color={Palette.blue} style={styles.loading} />
        )}
      </Screen>
    );
  }

  const left = timeLeft(dispute.escalatesAt, now);
  const closed = dispute.status === 'resolved' || dispute.status === 'withdrawn';
  const refund = dispute.refundRequestedPence;
  const byCustomer = dispute.openedByRole === 'customer';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        title={`Job ${dispute.jobNumber}`}
        footerStyle={styles.composerBar}
        footer={
          dispute.can.reply ? (
            <View style={styles.composer}>
              {attaching && <EvidencePicker kind="disputes" photos={photos} onChange={setPhotos} />}
              <ChatComposer
                value={draft}
                onChangeText={setDraft}
                onSend={() => void send()}
                placeholder="Reply to the thread…"
                sending={busy === 'send'}
                canSend={!busy && !!draft.trim()}
                maxLength={MAX_MESSAGE_CHARS}
              />
              {!attaching && (
                <Text
                  variant="caption"
                  color="blue"
                  style={styles.strong}
                  accessibilityRole="button"
                  onPress={() => setAttaching(true)}
                >
                  Attach photos as evidence
                </Text>
              )}
            </View>
          ) : undefined
        }
      >
        <View style={styles.intro}>
          <Text variant="h2">{byCustomer ? 'Dispute opened' : 'Issue you raised'}</Text>
          <View style={styles.line}>
            <Pill tone={STATUS_TONE[dispute.status]}>
              {left ? `${dispute.statusLabel} · ${left} left` : dispute.statusLabel}
            </Pill>
            <Text variant="caption" color="textMuted">
              {dispute.service}
            </Text>
          </View>
        </View>

        <Card style={styles.claim}>
          <IconTile icon={ShieldAlert} tone="error" />
          <View style={styles.grow}>
            <Text style={styles.strong}>
              {byCustomer ? `${dispute.customerName} says` : 'You said'}
            </Text>
            <Text variant="caption" color="textMuted">
              {dispute.reasonLabel}
            </Text>
            <Text color="textSecondary">“{dispute.description}”</Text>
            {refund != null && (
              <Text variant="caption" color="textMuted">
                Asked for: {formatPence(refund)} refund
              </Text>
            )}
            {dispute.photos.length > 0 && (
              <View style={styles.photos}>
                {dispute.photos.map((url) => (
                  <Image key={url} source={{ uri: url }} style={styles.photo} contentFit="cover" />
                ))}
              </View>
            )}
          </View>
        </Card>

        {!!left && (
          <Notice icon={LifeBuoy} title={`Book My Tech steps in in ${left}`}>
            If it isn’t sorted between you by then, BMT reviews it and decides. Nothing is refunded
            automatically.
          </Notice>
        )}

        {dispute.status === 'escalated' && (
          <Notice icon={LifeBuoy} tone="warn" title="Book My Tech is reviewing this">
            They’ll make a decision shortly. Add anything that helps your case to the thread.
          </Notice>
        )}

        {closed && (
          <Notice icon={Check} tone="success" title={dispute.resolutionLabel ?? dispute.statusLabel}>
            {[dispute.resolutionNote, dispute.payoutLine].filter(Boolean).join(' ') ||
              'This dispute is closed.'}
          </Notice>
        )}

        <View style={styles.section}>
          <Overline>Thread</Overline>
          {thread.length === 0 && (
            <Text variant="caption" color="textMuted">
              No replies yet.
            </Text>
          )}
          {thread.map((message) =>
            message.visible_to ? (
              <Card key={message.id} tone="warn" style={styles.private}>
                <View style={styles.line}>
                  <Icon icon={Lock} size={DetailSizing.chipIcon} strokeWidth={2} color={Palette.warningText} />
                  <Text variant="caption" color="warningText" style={styles.strong}>
                    Book My Tech · only you can see this
                  </Text>
                </View>
                <Text variant="bodySm" color="warningText">
                  {message.body}
                </Text>
              </Card>
            ) : (
              <View key={message.id} style={styles.bubble}>
                <ChatBubble
                  mine={message.sender_role === 'mechanic'}
                  meta={`${message.sender_role === 'customer' ? dispute.customerName : WHO[message.sender_role]} · ${formatLondon(new Date(message.created_at), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                >
                  {message.body}
                </ChatBubble>
                {message.photos.length > 0 && (
                  <View style={[styles.photos, message.sender_role === 'mechanic' && styles.mine]}>
                    {message.photos.map((url) => (
                      <Image key={url} source={{ uri: url }} style={styles.photo} contentFit="cover" />
                    ))}
                  </View>
                )}
              </View>
            ),
          )}
        </View>

        {(dispute.can.acceptRefund || dispute.can.offerRedo || dispute.can.escalate || dispute.can.withdraw) && (
          <Card style={styles.options}>
            <Text variant="caption" color="textSecondary" style={styles.strong}>
              Your options
            </Text>
            <Text variant="caption" color="textSecondary">
              Reply in the thread with your side and any photos. Or:
            </Text>
            {dispute.can.offerRedo && (
              <Button
                variant="secondary"
                disabled={busy !== null}
                loading={busy === 'redo'}
                onPress={() =>
                  confirm(
                    'Offer to put it right?',
                    `${dispute.customerName} is told you’ll come back and sort it at no extra cost. If they’re happy, they withdraw the dispute.`,
                    'Offer a re-do',
                    () => void run('redo', () => offerRedo(id)),
                  )
                }
              >
                Offer a re-do
              </Button>
            )}
            {dispute.can.escalate && (
              <Button
                variant="secondary"
                disabled={busy !== null}
                loading={busy === 'escalate'}
                onPress={() =>
                  confirm(
                    'Ask Book My Tech to step in?',
                    'BMT reviews the thread and the evidence and makes the decision. You can’t undo this.',
                    'Ask BMT to decide',
                    () => void run('escalate', () => escalateDispute(id)),
                  )
                }
              >
                Ask Book My Tech to step in
              </Button>
            )}
            {dispute.can.acceptRefund && refund != null && (
              <Button
                variant="destructive"
                disabled={busy !== null}
                loading={busy === 'refund'}
                onPress={() =>
                  confirm(
                    `Accept the ${formatPence(refund)} refund?`,
                    `${dispute.customerName} is refunded ${formatPence(refund)} and it comes out of your next payout. This closes the dispute and can’t be undone.`,
                    'Accept refund',
                    () => void run('refund', () => acceptRefund(id)),
                    true,
                  )
                }
              >
                {`Accept refund · ${formatPence(refund)}`}
              </Button>
            )}
            {dispute.can.withdraw && (
              <Button
                variant="ghost"
                disabled={busy !== null}
                loading={busy === 'withdraw'}
                onPress={() =>
                  confirm(
                    'Withdraw this?',
                    'Only do this if it’s been sorted. A withdrawn dispute can’t be reopened.',
                    'Withdraw',
                    async () => {
                      const done = await run('withdraw', () => withdrawDispute(id));
                      if (done) router.back();
                    },
                    true,
                  )
                }
              >
                Withdraw (we’ve sorted it)
              </Button>
            )}
          </Card>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { marginTop: Spacing[6] },
  intro: { gap: Spacing[2] },
  line: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing[2] },
  claim: { flexDirection: 'row', gap: Spacing[3], padding: Spacing[4] },
  grow: { flex: 1, gap: Spacing[1] },
  section: { gap: Spacing[2] },
  bubble: { gap: Spacing[1] },
  private: { gap: Spacing[1], padding: Spacing[3] },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginTop: Spacing[1] },
  mine: { justifyContent: 'flex-end' },
  photo: { width: JobPhotos.size, height: JobPhotos.size, borderRadius: Radius.tile },
  options: { gap: Spacing[2], padding: Spacing[4] },
  composer: { gap: Spacing[2] },
  composerBar: { backgroundColor: Palette.surfaceCard, borderTopColor: Palette.border },
  strong: { fontWeight: '700' },
});
