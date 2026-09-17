import { useLocalSearchParams, useRouter } from 'expo-router';
import { Package, Plus, Send, Trash2, TriangleAlert, Wrench } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, IconTile, Input, Notice, Overline, Screen, Text } from '@/components/ui';
import { DetailSizing, Palette, Spacing } from '@/constants/theme';
import { loadJob, previewQuote, sendQuote, type QuoteLineInput, type QuotePreview } from '@/lib/job';
import { formatPence } from '@/lib/offers';

interface DraftLine {
  key: number;
  kind: 'labour' | 'part';
  description: string;
  /** Hours for labour, quantity for a part — as typed. */
  amount: string;
  /** A part's unit price in pounds, as typed. */
  price: string;
}

const blank = (key: number, kind: DraftLine['kind']): DraftLine => ({
  key,
  kind,
  description: kind === 'labour' ? 'Labour' : '',
  amount: '1',
  price: '',
});

/** Only lines complete enough to price; the rest wait until they are. */
function toInput(lines: DraftLine[]): QuoteLineInput[] {
  return lines.flatMap((line): QuoteLineInput[] => {
    const description = line.description.trim();
    const amount = Number(line.amount);
    if (!description || !Number.isFinite(amount) || amount <= 0) return [];

    if (line.kind === 'labour') return [{ kind: 'labour', description, hours: amount }];

    const pounds = Number(line.price);
    if (!Number.isFinite(pounds) || pounds <= 0) return [];
    return [
      { kind: 'part', description, quantity: Math.round(amount), unitPence: Math.round(pounds * 100) },
    ];
  });
}

/**
 * Quote for extra work found on the job. The customer gets a push and approves
 * or declines; approved work is added to the booking and to the payout.
 *
 * Every figure comes from the CRM's preview — the labour rate and the
 * commission are the platform's, not something the app or the mechanic sets.
 */
export default function QuoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    kind?: string;
    faultId?: string;
    fault?: string;
  }>();
  const { id, faultId } = params;
  // A return visit, quoted while working or once the job is complete; otherwise extra work now.
  const kind = params.kind === 'follow_on' ? 'follow_on' : 'now';

  const [customer, setCustomer] = useState('the customer');
  const [note, setNote] = useState(params.fault ?? '');
  const [lines, setLines] = useState<DraftLine[]>([blank(1, 'labour')]);
  const [nextKey, setNextKey] = useState(2);
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    loadJob(id).then((result) => {
      const name = result.ok ? result.job.booking.customer_name?.trim().split(/\s+/)[0] : null;
      if (active && name) setCustomer(name);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const input = toInput(lines);
  const signature = JSON.stringify(input);

  // Re-priced a beat after typing stops, so a half-typed price is not sent.
  useEffect(() => {
    const priced: QuoteLineInput[] = JSON.parse(signature);
    let active = true;

    const timer = setTimeout(async () => {
      if (priced.length === 0) {
        if (active) setPreview(null);
        return;
      }
      const result = await previewQuote(id, priced);
      if (!active) return;
      setPreview(result.ok ? result.preview : null);
      setPreviewError(result.ok ? null : result.error);
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id, signature]);

  function patch(key: number, change: Partial<DraftLine>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...change } : line)));
  }

  function add(kind: DraftLine['kind']) {
    setLines((current) => [...current, blank(nextKey, kind)]);
    setNextKey((key) => key + 1);
  }

  async function onSend() {
    setSending(true);
    setError(null);

    const result = await sendQuote(id, {
      kind,
      title: input[0]?.description,
      note: note.trim() || undefined,
      // The first line answers the fault this quote was opened from.
      lines: input.map((line, index) => (index === 0 && faultId ? { ...line, faultId } : line)),
    });
    setSending(false);

    if (result.ok) router.back();
    else setError(result.error);
  }

  const complete = input.length === lines.length && input.length > 0;

  return (
    <Screen
      title={kind === 'follow_on' ? 'Quote a return visit' : 'Quote for extra work'}
      avoidKeyboard
      footer={
        <Button
          fullWidth
          size="xl"
          iconLeft={Send}
          loading={sending}
          disabled={!complete || !preview}
          onPress={onSend}
        >
          {`Send quote to ${customer}`}
        </Button>
      }
    >
      <Text color="textSecondary">
        {kind === 'follow_on'
          ? `${customer} gets a notification. If they approve, they book the return visit and you’re offered it first.`
          : `${customer} gets a notification and can approve or decline. Approved work is added to the booking and to what you’re paid.`}
      </Text>

      <Input
        label="What did you find?"
        value={note}
        onChangeText={setNote}
        placeholder="Rear pads worn to 20% — need replacing before they score the discs."
        rows={3}
        maxLength={1000}
      />

      <View style={styles.section}>
        <Overline>Line items</Overline>
        {lines.map((line, index) => (
          <Card key={line.key} style={styles.line}>
            <View style={styles.row}>
              <IconTile icon={line.kind === 'labour' ? Wrench : Package} size="sm" />
              <Text variant="bodySm" style={styles.kind}>
                {line.kind === 'labour' ? 'Labour' : 'Part'}
              </Text>
              {!!preview?.lines[index] && complete && (
                <Text variant="bodySm" style={styles.strong}>
                  {formatPence(preview.lines[index].linePence)}
                </Text>
              )}
              {lines.length > 1 && (
                <Pressable
                  onPress={() => setLines((current) => current.filter((l) => l.key !== line.key))}
                  accessibilityRole="button"
                  accessibilityLabel="Remove this line"
                  hitSlop={Spacing[2]}
                >
                  <Icon icon={Trash2} size={DetailSizing.rowIcon} strokeWidth={2} color={Palette.textMuted} />
                </Pressable>
              )}
            </View>
            <Input
              value={line.description}
              onChangeText={(description) => patch(line.key, { description })}
              placeholder={line.kind === 'labour' ? 'Fit rear brake pads' : 'Rear brake pads (Bosch)'}
              maxLength={200}
            />
            <View style={styles.row}>
              <Input
                label={line.kind === 'labour' ? 'Hours' : 'Quantity'}
                value={line.amount}
                onChangeText={(amount) => patch(line.key, { amount })}
                keyboardType={line.kind === 'labour' ? 'decimal-pad' : 'number-pad'}
                containerStyle={styles.grow}
                helper={
                  line.kind === 'labour' && preview
                    ? `at ${formatPence(preview.hourlyRatePence)}/hr`
                    : undefined
                }
              />
              {line.kind === 'part' && (
                <Input
                  label="Price each (£)"
                  value={line.price}
                  onChangeText={(price) => patch(line.key, { price })}
                  keyboardType="decimal-pad"
                  placeholder="22.50"
                  containerStyle={styles.grow}
                />
              )}
            </View>
          </Card>
        ))}
        <View style={styles.row}>
          <Button variant="secondary" size="sm" iconLeft={Plus} style={styles.grow} onPress={() => add('labour')}>
            Add labour
          </Button>
          <Button variant="secondary" size="sm" iconLeft={Plus} style={styles.grow} onPress={() => add('part')}>
            Add a part
          </Button>
        </View>
      </View>

      {!!error && (
        <Notice icon={TriangleAlert} tone="danger" title="That didn’t send">
          {error}
        </Notice>
      )}

      {/* The CRM declines to price a line that is still being typed; that is a hint, not a failure. */}
      {!error && !!previewError && complete && (
        <Text variant="caption" color="textMuted">
          {previewError}
        </Text>
      )}

      {preview && complete && (
        <Card selected style={styles.total}>
          <View style={styles.between}>
            <View>
              <Text variant="caption" color="textSecondary" style={styles.strong}>
                Customer pays
              </Text>
              <Text variant="caption" color="textMuted">
                {kind === 'follow_on' ? 'For the return visit' : 'Added to the booking'}
              </Text>
            </View>
            <Text variant="display">{formatPence(preview.totalPence)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.between}>
            <Text variant="caption" color="textSecondary">
              You earn
            </Text>
            <Text style={styles.strong}>{formatPence(preview.mechanicPayoutPence)}</Text>
          </View>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing[2] },
  line: { gap: Spacing[2], padding: Spacing[4] },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2] },
  kind: { flex: 1, fontWeight: '700', alignSelf: 'center' },
  grow: { flex: 1 },
  strong: { fontWeight: '700' },
  total: { gap: Spacing[3], padding: Spacing[4] },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: Palette.blueTintStrong },
});
