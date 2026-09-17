import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Minus, Package, Plus, Search, Send, TriangleAlert, Undo2, Wrench, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { ChoiceList } from '@/components/choice-list';
import { Button, Card, Icon, IconTile, Input, Notice, Overline, Pill, Screen, Text } from '@/components/ui';
import { DetailSizing, Palette, Spacing, type Tone } from '@/constants/theme';
import {
  endJobOnSite,
  fetchRevisionState,
  previewRevision,
  searchCatalogue,
  sendRevision,
  withdrawRevision,
  type CatalogueHit,
  type OnSiteOption,
  type RevisionDraft,
  type RevisionPreview,
  type RevisionState,
} from '@/lib/job';
import { formatPence } from '@/lib/offers';

const STATUS_TONE: Record<string, Tone> = {
  sent: 'pending',
  approved: 'success',
  declined: 'error',
  withdrawn: 'neutral',
  expired: 'neutral',
};

interface NewPart {
  key: number;
  name: string;
  quantity: number;
  /** Pounds, as typed. */
  price: string;
}

const signed = (pence: number) => `${pence < 0 ? '−' : '+'}${formatPence(Math.abs(pence))}`;

/**
 * "Change what's being done" — the booked repair turned out not to be the
 * right one. The mechanic takes repairs and parts off, adds others, and the
 * customer approves the re-priced job before work carries on. Once per job.
 *
 * Every price is the CRM's: the screen edits a list of ids and asks for a
 * preview. If the customer declines, this is also where the job can be ended
 * on site.
 */
export default function ReviseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [state, setState] = useState<RevisionState | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Repairs kept from the job, and ones added from the catalogue. */
  const [removedRepairs, setRemovedRepairs] = useState<readonly string[]>([]);
  const [addedRepairs, setAddedRepairs] = useState<CatalogueHit[]>([]);
  /** Parts on the job: quantity by id, 0 meaning taken off. */
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [newParts, setNewParts] = useState<NewPart[]>([]);
  const [nextKey, setNextKey] = useState(1);

  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<CatalogueHit[] | null>(null);
  const [searching, setSearching] = useState(false);

  const [preview, setPreview] = useState<RevisionPreview | null>(null);
  const [previewNote, setPreviewNote] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await fetchRevisionState(id);
    if (result.ok) {
      setState(result.state);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const current = state?.current;

  const draft: RevisionDraft | null = current
    ? {
        repairIds: [
          ...current.repairs.filter((repair) => !removedRepairs.includes(repair.id)).map((r) => r.id),
          ...addedRepairs.map((hit) => hit.id),
        ],
        parts: [
          ...current.parts
            .map((part) => ({ id: part.id, quantity: quantities[part.id] ?? part.quantity }))
            .filter((part) => part.quantity > 0),
          ...newParts
            .filter((part) => part.name.trim() && Number(part.price) > 0)
            .map((part) => ({
              name: part.name.trim(),
              quantity: part.quantity,
              unitPence: Math.round(Number(part.price) * 100),
            })),
        ],
      }
    : null;

  const changed =
    removedRepairs.length > 0 ||
    addedRepairs.length > 0 ||
    newParts.length > 0 ||
    (current?.parts ?? []).some((part) => (quantities[part.id] ?? part.quantity) !== part.quantity);

  const signature = changed && draft ? JSON.stringify(draft) : null;

  // Re-priced a beat after the last change.
  useEffect(() => {
    if (!signature) return;
    const next: RevisionDraft = JSON.parse(signature);
    let active = true;

    const timer = setTimeout(async () => {
      const result = await previewRevision(id, next);
      if (!active) return;
      setPreview(result.ok ? result.preview : null);
      setPreviewNote(result.ok ? null : result.error);
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id, signature]);

  // The catalogue wants three characters before it will search.
  const term = query.trim();
  useEffect(() => {
    if (term.length < 3) return;
    let active = true;

    const timer = setTimeout(async () => {
      setSearching(true);
      const result = await searchCatalogue(id, term);
      if (!active) return;
      setSearching(false);
      setHits(result.ok ? result.hits : []);
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id, term]);

  function reset() {
    setRemovedRepairs([]);
    setAddedRepairs([]);
    setQuantities({});
    setNewParts([]);
    setPreview(null);
    setPreviewNote(null);
    setReason('');
  }

  async function run(key: string, action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    if (busy) return false;
    setBusy(key);
    const result = await action();
    await load();
    setBusy(null);
    if (!result.ok) Alert.alert('That didn’t go through', result.error);
    return result.ok;
  }

  async function onSend() {
    if (!draft) return;
    const sent = await run('send', () => sendRevision(id, { ...draft, reason: reason.trim() }));
    if (sent) reset();
  }

  function onEnd(option: OnSiteOption) {
    Alert.alert(
      option.pence > 0 ? `Charge ${formatPence(option.pence)} and end the job?` : 'End the job with no charge?',
      option.hint,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'End the job',
          style: 'destructive',
          onPress: async () => {
            const ended = await run('end', () => endJobOnSite(id, { charge: option.kind }));
            if (ended) router.back();
          },
        },
      ],
    );
  }

  if (!state || !current) {
    return (
      <Screen title="Change the job">
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

  const showHits = term.length >= 3 && hits !== null;
  const canSend = changed && !!preview && reason.trim().length > 0 && state.canRevise;

  return (
    <Screen
      title="Change the job"
      avoidKeyboard
      footer={
        state.canRevise ? (
          <Button
            fullWidth
            size="xl"
            iconLeft={Send}
            loading={busy === 'send'}
            disabled={!canSend || busy !== null}
            onPress={onSend}
          >
            Send to the customer
          </Button>
        ) : undefined
      }
    >
      {state.revisions.map((revision) => (
        <Card key={revision.id} style={styles.stack}>
          <View style={styles.between}>
            <Pill tone={STATUS_TONE[revision.status] ?? 'neutral'}>{revision.statusLabel}</Pill>
            <Text variant="bodySm" style={styles.strong}>
              {signed(revision.differencePence)}
            </Text>
          </View>
          <Text variant="bodySm">{revision.summary}</Text>
          <Text variant="caption" color="textSecondary">
            “{revision.reason}”
          </Text>
          {revision.status === 'sent' && (
            <Button
              size="sm"
              variant="secondary"
              loading={busy === 'withdraw'}
              disabled={busy !== null}
              onPress={() => void run('withdraw', () => withdrawRevision(revision.id))}
            >
              Withdraw
            </Button>
          )}
        </Card>
      ))}

      {!!state.onSiteOptions?.length && (
        <View style={styles.section}>
          <Overline>The customer declined</Overline>
          <Text color="textSecondary">
            You can carry on with the job as booked, or end it here.
          </Text>
          <ChoiceList
            disabled={busy !== null}
            items={state.onSiteOptions.map((option) => ({
              key: option.kind,
              icon: option.pence > 0 ? Wrench : X,
              label: option.label,
              onPress: () => onEnd(option),
            }))}
          />
        </View>
      )}

      {!state.canRevise ? (
        !!state.reviseBlocker && (
          <Notice icon={TriangleAlert} title="Can’t be changed right now">
            {state.reviseBlocker}
          </Notice>
        )
      ) : (
        <>
          <View style={styles.intro}>
            <Text variant="h1">What needs doing instead?</Text>
            <Text color="textSecondary">
              Take off what isn’t right and add what is. The customer sees the new price and
              approves it before you carry on. A job can be changed once.
            </Text>
          </View>

          <View style={styles.section}>
            <Overline>Repairs</Overline>
            <Card padded={false}>
              {current.repairs.map((repair, index) => {
                const off = removedRepairs.includes(repair.id);
                return (
                  <View key={repair.id} style={[styles.item, index > 0 && styles.divider]}>
                    <View style={styles.grow}>
                      <Text variant="bodySm" color={off ? 'textDisabled' : 'textPrimary'} style={[styles.strong, off && styles.struck]}>
                        {repair.description}
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {formatPence(repair.linePence)}
                      </Text>
                    </View>
                    <Button
                      size="sm"
                      variant="ghost"
                      iconLeft={off ? Undo2 : X}
                      onPress={() =>
                        setRemovedRepairs((ids) =>
                          off ? ids.filter((other) => other !== repair.id) : [...ids, repair.id],
                        )
                      }
                    >
                      {off ? 'Keep' : 'Remove'}
                    </Button>
                  </View>
                );
              })}
              {addedRepairs.map((hit) => (
                <View key={hit.id} style={[styles.item, styles.divider]}>
                  <View style={styles.grow}>
                    <Text variant="bodySm" color="blueDark" style={styles.strong}>
                      {hit.description}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      Added{hit.pricePence != null ? ` · ${formatPence(hit.pricePence)}` : ''}
                    </Text>
                  </View>
                  <Button
                    size="sm"
                    variant="ghost"
                    iconLeft={X}
                    onPress={() => setAddedRepairs((all) => all.filter((other) => other.id !== hit.id))}
                  >
                    Remove
                  </Button>
                </View>
              ))}
            </Card>

            <Input
              iconLeft={Search}
              value={query}
              onChangeText={setQuery}
              placeholder="Add a repair — search for this car"
              autoCorrect={false}
              helper={term.length > 0 && term.length < 3 ? 'Keep typing — three letters or more.' : undefined}
            />
            {searching && <ActivityIndicator color={Palette.blue} />}
            {showHits && hits.length === 0 && !searching && (
              <Text variant="caption" color="textMuted">
                Nothing for this car under “{term}”.
              </Text>
            )}
            {showHits && hits.length > 0 && (
              <Card padded={false}>
                {hits.slice(0, 8).map((hit, index) => {
                  const taken =
                    addedRepairs.some((other) => other.id === hit.id) ||
                    current.repairs.some((repair) => repair.id === hit.id);
                  return (
                    <Pressable
                      key={hit.id}
                      disabled={taken}
                      accessibilityRole="button"
                      onPress={() => {
                        setAddedRepairs((all) => [...all, hit]);
                        setQuery('');
                        setHits(null);
                      }}
                      style={[styles.item, index > 0 && styles.divider, taken && styles.dim]}
                    >
                      <View style={styles.grow}>
                        <Text variant="bodySm" style={styles.strong}>
                          {hit.description}
                        </Text>
                        <Text variant="caption" color="textMuted">
                          {[
                            hit.optionLabel ?? hit.bundleName,
                            hit.billedHours != null ? `${hit.billedHours}h` : null,
                            hit.pricePence != null ? formatPence(hit.pricePence) : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                      <Icon icon={Plus} size={DetailSizing.rowIcon} strokeWidth={2} color={Palette.blue} />
                    </Pressable>
                  );
                })}
              </Card>
            )}
          </View>

          <View style={styles.section}>
            <Overline>Your parts</Overline>
            {current.parts.length + newParts.length > 0 && (
              <Card padded={false}>
                {current.parts.map((part, index) => {
                  const quantity = quantities[part.id] ?? part.quantity;
                  const set = (next: number) =>
                    setQuantities((all) => ({ ...all, [part.id]: Math.min(99, Math.max(0, next)) }));
                  return (
                    <View key={part.id} style={[styles.item, index > 0 && styles.divider]}>
                      <View style={styles.grow}>
                        <Text
                          variant="bodySm"
                          color={quantity === 0 ? 'textDisabled' : 'textPrimary'}
                          style={[styles.strong, quantity === 0 && styles.struck]}
                        >
                          {part.name}
                        </Text>
                        <Text variant="caption" color="textMuted">
                          {formatPence(part.unitPence)} each
                        </Text>
                      </View>
                      <Stepper value={quantity} onChange={set} label={part.name} />
                    </View>
                  );
                })}
                {newParts.map((part, index) => (
                  <View
                    key={part.key}
                    style={[styles.newPart, (index > 0 || current.parts.length > 0) && styles.divider]}
                  >
                    <View style={styles.between}>
                      <IconTile icon={Package} size="sm" />
                      <Stepper
                        value={part.quantity}
                        min={1}
                        label={part.name || 'new part'}
                        onChange={(quantity) =>
                          setNewParts((all) =>
                            all.map((other) => (other.key === part.key ? { ...other, quantity } : other)),
                          )
                        }
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        iconLeft={X}
                        onPress={() => setNewParts((all) => all.filter((other) => other.key !== part.key))}
                      >
                        Remove
                      </Button>
                    </View>
                    <View style={styles.row}>
                      <Input
                        value={part.name}
                        onChangeText={(name) =>
                          setNewParts((all) =>
                            all.map((other) => (other.key === part.key ? { ...other, name } : other)),
                          )
                        }
                        placeholder="Part name"
                        maxLength={200}
                        containerStyle={styles.name}
                      />
                      <Input
                        value={part.price}
                        onChangeText={(price) =>
                          setNewParts((all) =>
                            all.map((other) => (other.key === part.key ? { ...other, price } : other)),
                          )
                        }
                        placeholder="£ each"
                        keyboardType="decimal-pad"
                        containerStyle={styles.grow}
                      />
                    </View>
                  </View>
                ))}
              </Card>
            )}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={Plus}
              onPress={() => {
                setNewParts((all) => [...all, { key: nextKey, name: '', quantity: 1, price: '' }]);
                setNextKey((key) => key + 1);
              }}
            >
              Add a part
            </Button>
          </View>

          {changed && !!previewNote && (
            <Text variant="caption" color="textMuted">
              {previewNote}
            </Text>
          )}

          {changed && preview && (
            <Card selected style={styles.stack}>
              {preview.diff.lines.removed.map((line) => (
                <Text key={`r-${line.description}`} variant="bodySm" color="textSecondary">
                  − {line.description}
                </Text>
              ))}
              {preview.diff.lines.added.map((line) => (
                <Text key={`a-${line.description}`} variant="bodySm" color="blueDark">
                  + {line.description}
                </Text>
              ))}
              {preview.diff.parts.removed.map((part) => (
                <Text key={`pr-${part.name}`} variant="bodySm" color="textSecondary">
                  − {part.name}
                </Text>
              ))}
              {preview.diff.parts.added.map((part) => (
                <Text key={`pa-${part.name}`} variant="bodySm" color="blueDark">
                  + {part.name}
                  {part.quantity > 1 ? ` × ${part.quantity}` : ''}
                </Text>
              ))}
              <View style={styles.rule} />
              <View style={styles.between}>
                <View>
                  <Text variant="caption" color="textSecondary" style={styles.strong}>
                    Customer pays
                  </Text>
                  <Text variant="caption" color="textMuted">
                    was {formatPence(preview.before.totalPence)} · {signed(preview.diff.differencePence)}
                  </Text>
                </View>
                <Text variant="display">{formatPence(preview.after.totalPence)}</Text>
              </View>
              <View style={styles.between}>
                <Text variant="caption" color="textSecondary">
                  You earn
                </Text>
                <Text style={styles.strong}>
                  {formatPence(preview.after.mechanicPayoutPence)}
                  <Text variant="caption" color="textMuted">
                    {'  '}was {formatPence(preview.before.mechanicPayoutPence)}
                  </Text>
                </Text>
              </View>
            </Card>
          )}

          {changed && (
            <Input
              label="Why isn’t the booked repair right?"
              value={reason}
              onChangeText={setReason}
              placeholder="The discs are fine — it’s only the pads that are worn."
              helper="The customer reads this before approving."
              rows={3}
              maxLength={500}
            />
          )}
        </>
      )}
    </Screen>
  );
}

interface StepperProps {
  value: number;
  min?: number;
  label: string;
  onChange: (value: number) => void;
}

function Stepper({ value, min = 0, label, onChange }: StepperProps) {
  return (
    <View style={styles.stepper}>
      <Button
        size="sm"
        variant="secondary"
        iconOnly
        round
        iconLeft={Minus}
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
      >
        {`Fewer ${label}`}
      </Button>
      <Text style={styles.count}>{value}</Text>
      <Button
        size="sm"
        variant="secondary"
        iconOnly
        round
        iconLeft={Plus}
        disabled={value >= 99}
        onPress={() => onChange(Math.min(99, value + 1))}
      >
        {`More ${label}`}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: Spacing[6] },
  intro: { gap: Spacing[1] },
  section: { gap: Spacing[2] },
  stack: { gap: Spacing[2], padding: Spacing[4] },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  newPart: { gap: Spacing[2], paddingVertical: Spacing[3], paddingHorizontal: Spacing[4] },
  divider: { borderTopWidth: 1, borderTopColor: Palette.borderSubtle },
  rule: { height: 1, backgroundColor: Palette.blueTintStrong },
  row: { flexDirection: 'row', gap: Spacing[2] },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing[3] },
  grow: { flex: 1, gap: Spacing[1] / 2 },
  name: { flex: 2 },
  strong: { fontWeight: '700' },
  struck: { textDecorationLine: 'line-through' },
  dim: { opacity: 0.4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  count: { minWidth: Spacing[5], textAlign: 'center', fontWeight: '700' },
});
