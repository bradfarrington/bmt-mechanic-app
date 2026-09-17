import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Camera,
  Check,
  CircleCheck,
  ClipboardCheck,
  Clock,
  FilePenLine,
  Lock,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Play,
  Plus,
  TriangleAlert,
  Wrench,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { JourneyMap } from '@/components/journey-map';
import { StatusStrip, type StripTone } from '@/components/status-strip';
import {
  Button,
  Card,
  Icon,
  IconTile,
  Input,
  Notice,
  Overline,
  Pill,
  Screen,
  Text,
} from '@/components/ui';
import {
  DetailSizing,
  JobPhotos,
  OnDark,
  Palette,
  Radius,
  Sizing,
  Spacing,
} from '@/constants/theme';
import { useJourneySharing } from '@/hooks/use-journey-sharing';
import { useAuth } from '@/lib/auth';
import {
  beginWork,
  completeJob,
  fetchJobExtras,
  initials,
  jobAddress,
  jobReference,
  loadJob,
  phoneRevealed,
  removeFault,
  removePhoto,
  setMileage,
  setPartSourcing,
  setPartStatus,
  startJourney,
  uploadPhoto,
  withdrawQuote,
  type JobExtras,
  type JobPart,
  type PartStatus,
  type JobRecord,
} from '@/lib/job';
import { estimateEta } from '@/lib/location';
import { formatLondon } from '@/lib/london-time';
import { formatPence } from '@/lib/offers';
import { useStatus } from '@/lib/status';
import { formatMinutes } from '@/lib/summary';

const time = (iso: string | null) =>
  iso ? formatLondon(new Date(iso), { hour: '2-digit', minute: '2-digit' }) : '';

const QUOTE_STATUS: Record<string, string> = {
  sent: 'Waiting for the customer',
  approved: 'Approved',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
  draft: 'Draft',
};

const PART_STATUS: Record<string, string> = {
  pending: 'Not ordered',
  ordered: 'Ordered',
  delivered: 'Delivered',
  used: 'Used',
  returned: 'Returned',
};

/** What comes next for a part: BMT's are ordered, delivered, then used; the mechanic's own are simply used. */
function nextPartStep(part: JobPart): { status: PartStatus; label: string } | null {
  if (part.status === 'ordered') return { status: 'delivered', label: 'Mark delivered' };
  if (part.status === 'delivered' || part.status === 'pending') return { status: 'used', label: 'Mark used' };
  return null;
}

/**
 * One job, from confirmed through to paid. The booking's `status` decides
 * everything on the screen; every button that changes it goes through the CRM,
 * and the screen re-reads rather than assuming the change took.
 */
export default function JobScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mechanic } = useAuth();
  const { refreshStatus } = useStatus();

  const [job, setJob] = useState<JobRecord | null>(null);
  const [extras, setExtras] = useState<JobExtras | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  /** Which action is in flight — one at a time. */
  const [busy, setBusy] = useState<string | null>(null);
  const [mileage, setMileageText] = useState('');
  // Read when the job is: "42 min so far" is as of the last load, not of each render.
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const [record, more] = await Promise.all([loadJob(id), fetchJobExtras(id)]);
    if (more.ok) setExtras(more.extras);
    setNow(Date.now());
    if (record.ok) {
      setJob(record.job);
      setError(null);
      setMileageText((current) => current || String(record.job.booking.mileage ?? ''));
    } else {
      setError(record.error);
    }
  }, [id]);

  // On focus: the checklist, quote and message screens all change this one.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const status = job?.booking.status ?? '';
  const { state: sharing, fix } = useJourneySharing(mechanic?.id, status === 'en_route');

  /** Run a CRM action, show its refusal as-is, and re-read whatever happened. */
  async function run(key: string, action: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    if (busy) return false;
    setBusy(key);
    const result = await action();
    // The tab bar's status button follows the job: en route and working are "On a job".
    await Promise.all([load(), refreshStatus()]);
    setBusy(null);
    if (!result.ok) Alert.alert('That didn’t go through', result.error);
    return result.ok;
  }

  if (!job) {
    return (
      <Screen title="Job">
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

  const { booking, photos, parts, quotes, faults } = job;
  const money = extras?.money;
  const payout = formatPence(money?.payoutPence ?? booking.mechanic_payout_pence);
  const charge = formatPence(money?.chargePence ?? booking.total_pence);
  const customer = booking.customer_name?.trim() || 'Customer';
  const firstName = customer.split(/\s+/)[0];
  const address = jobAddress(booking);
  const active = ['confirmed', 'en_route', 'in_progress'].includes(status);
  const canMessage = active;
  const reschedulePending = booking.reschedule_status === 'proposed';
  const openQuote = quotes.find((quote) => quote.status === 'sent');
  const checklists = extras?.checklists ?? [];
  const eta =
    fix && extras?.destination ? estimateEta(fix, extras.destination, fix.speedMps) : null;

  const strip: { tone: StripTone; text: string; live?: boolean } =
    status === 'en_route'
      ? {
          tone: 'enRoute',
          live: true,
          text:
            sharing === 'sharing'
              ? `You’re marked as on the way · ${firstName} can see you on the map`
              : 'You’re marked as on the way',
        }
      : status === 'in_progress'
        ? {
            tone: 'inProgress',
            live: true,
            text: `Working · Started ${time(booking.started_at)}${
              booking.started_at
                ? ` · ${formatMinutes(Math.max(0, (now - new Date(booking.started_at).getTime()) / 60_000))} so far`
                : ''
            }`,
          }
        : status === 'completed'
          ? { tone: 'completed', text: `Complete · Finished ${time(booking.completed_at)}` }
          : status === 'cancelled'
            ? { tone: 'cancelled', text: 'Cancelled' }
            : { tone: 'active', text: `Confirmed · ${time(booking.scheduled_at)}${booking.slot_window ? ` · ${booking.slot_window}` : ''}` };

  function directions(app: 'maps' | 'waze') {
    const query = encodeURIComponent(address || booking.postcode);
    void Linking.openURL(
      app === 'waze'
        ? `https://waze.com/ul?q=${query}&navigate=yes`
        : `https://www.google.com/maps/dir/?api=1&destination=${query}`,
    );
  }

  async function addPhoto(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        source === 'camera' ? 'Camera is off' : 'Photos are off',
        'Allow it for Book My Tech in Settings to add photos to a job.',
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const picked =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    const asset = picked.assets?.[0];
    if (picked.canceled || !asset) return;

    await run('photo', () => uploadPhoto(id, asset));
  }

  function onComplete() {
    Alert.alert(
      `Charge ${charge}?`,
      `This takes ${charge} from ${firstName}’s card and marks the job complete. You’re paid out 24 hours later.`,
      [
        { text: 'Not yet', style: 'cancel' },
        { text: `Confirm & charge ${charge}`, onPress: () => void run('complete', () => completeJob(id)) },
      ],
    );
  }

  async function saveMileage() {
    const miles = Number(mileage.replace(/[\s,]/g, ''));
    if (!Number.isInteger(miles) || miles < 0) {
      Alert.alert('Check the mileage', 'Enter it as a whole number of miles.');
      return;
    }
    await run('mileage', () => setMileage(id, miles));
  }

  const footer =
    status === 'confirmed' ? (
      <View style={styles.actions}>
        {reschedulePending ? (
          <Notice icon={TriangleAlert} tone="warn" title="New time proposed">
            {`Waiting for ${firstName} to answer before you set off.`}
          </Notice>
        ) : (
          <Button
            fullWidth
            size="xl"
            iconLeft={Navigation}
            loading={busy === 'start'}
            disabled={busy !== null}
            onPress={() => void run('start', () => startJourney(id))}
          >
            Start journey
          </Button>
        )}
        <View style={styles.row}>
          <Button
            variant="ghost"
            size="sm"
            style={styles.grow}
            disabled={busy !== null || reschedulePending}
            onPress={() => router.push({ pathname: '/jobs/[id]/reschedule', params: { id } })}
          >
            Propose new time
          </Button>
          <Button
            variant="ghost"
            size="sm"
            style={styles.grow}
            disabled={busy !== null}
            onPress={() => router.push({ pathname: '/jobs/[id]/cancel', params: { id } })}
          >
            Cancel job
          </Button>
        </View>
      </View>
    ) : status === 'en_route' ? (
      <Button
        fullWidth
        size="xl"
        iconLeft={Play}
        loading={busy === 'begin'}
        disabled={busy !== null}
        onPress={() => void run('begin', () => beginWork(id))}
      >
        I’ve arrived — begin work
      </Button>
    ) : status === 'in_progress' ? (
      <Button
        fullWidth
        size="xl"
        variant="success"
        iconLeft={Check}
        loading={busy === 'complete'}
        disabled={busy !== null || !!extras?.completeBlocker}
        onPress={onComplete}
      >
        Complete job & charge customer
      </Button>
    ) : undefined;

  const customerCard = (
    <Card style={styles.stack}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text color="blueDark" style={styles.strong}>
            {initials(booking.customer_name)}
          </Text>
        </View>
        <View style={styles.grow}>
          <Text style={styles.strong}>{customer}</Text>
          <Text variant="caption" color="textMuted">
            Customer
          </Text>
        </View>
        {canMessage && (
          <Button
            size="sm"
            variant="secondary"
            iconOnly
            iconLeft={MessageCircle}
            onPress={() => router.push({ pathname: '/jobs/[id]/messages', params: { id } })}
          >
            {`Message ${firstName}`}
          </Button>
        )}
        {phoneRevealed(status) && !!booking.customer_phone && (
          <Button
            size="sm"
            iconOnly
            iconLeft={Phone}
            onPress={() => void Linking.openURL(`tel:${booking.customer_phone}`)}
          >
            {`Call ${firstName}`}
          </Button>
        )}
      </View>
      <View style={styles.divider} />
      <View style={styles.line}>
        <Icon icon={MapPin} size={DetailSizing.rowIcon} strokeWidth={2} color={Palette.textMuted} />
        <Text variant="bodySm" style={styles.grow}>
          {address || 'Address not given'}
        </Text>
      </View>
      {!phoneRevealed(status) && active && (
        <View style={styles.line}>
          <Icon icon={Lock} size={DetailSizing.rowIcon} strokeWidth={2} color={Palette.textFaint} />
          <Text variant="bodySm" color="textFaint" style={styles.grow}>
            Phone number revealed once you’re en route
          </Text>
        </View>
      )}
      {active && (
        <View style={styles.row}>
          <Button variant="secondary" iconLeft={Navigation} style={styles.grow} onPress={() => directions('maps')}>
            Get directions
          </Button>
          <Button variant="secondary" style={styles.grow} onPress={() => directions('waze')}>
            Open in Waze
          </Button>
        </View>
      )}
    </Card>
  );

  const moneyCard = money && (
    <View style={styles.dark}>
      <Overline color={OnDark.cardText}>
        {status === 'completed' ? 'You earned' : 'Earnings breakdown'}
      </Overline>
      {(
        [
          ['Customer pays', formatPence(money.customerPaysPence)],
          money.bmtPartsPence > 0 ? ['Minus parts (BMT-sourced)', `−${formatPence(money.bmtPartsPence)}`] : null,
          [
            `Minus ${Math.round(money.commissionRate * 100)}% platform fee`,
            `−${formatPence(money.platformFeePence)}`,
          ],
        ] as ([string, string] | null)[]
      )
        .filter((row): row is [string, string] => row !== null)
        .map(([label, value]) => (
          <View key={label} style={styles.between}>
            <Text variant="bodySm" color={OnDark.textStrong}>
              {label}
            </Text>
            <Text variant="bodySm" color="textInverse" style={styles.strong}>
              {value}
            </Text>
          </View>
        ))}
      <View style={styles.darkDivider} />
      <View style={styles.between}>
        <Text color="textInverse" style={styles.strong}>
          You receive
        </Text>
        <Text variant="display" color="textInverse">
          {formatPence(money.payoutPence)}
        </Text>
      </View>
      <Text variant="caption" color={OnDark.cardText}>
        Paid 24 hours after the job is completed.
      </Text>
    </View>
  );

  return (
    <Screen
      title={jobReference(booking.job_number)}
      belowHeader={
        <StatusStrip tone={strip.tone} live={strip.live}>
          {strip.text}
        </StatusStrip>
      }
      footer={footer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={Palette.blue}
        />
      }
    >
      {status === 'completed' && (
        <Card elevated style={styles.done}>
          <IconTile icon={CircleCheck} tone="success" size="xl" />
          <Text variant="h2">Nicely done.</Text>
          <Text color="textSecondary" style={styles.centred}>
            {`${firstName} has been charged ${charge}. Your ${payout} is paid out 24 hours after completion.`}
          </Text>
        </Card>
      )}

      {status === 'cancelled' && !!booking.cancellation_reason && (
        <Notice icon={TriangleAlert} tone="danger" title="This job was cancelled">
          {booking.cancellation_reason}
        </Notice>
      )}

      <View style={styles.intro}>
        <Text variant="h1">{booking.repair_description ?? 'Repair'}</Text>
        <View style={styles.line}>
          <Text variant="mono" color="textSecondary">
            {[booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(' ').toUpperCase()}
            {' · '}
            {booking.vehicle_reg}
          </Text>
          {status === 'confirmed' && (
            <Text variant="caption" color="textMuted">
              · You earn <Text variant="caption" style={styles.strong}>{payout}</Text>
            </Text>
          )}
        </View>
      </View>

      {status === 'en_route' && (
        <Card style={styles.stack}>
          {extras?.destination && <JourneyMap destination={extras.destination} position={fix} />}
          {sharing === 'denied' ? (
            <Notice icon={MapPin} tone="warn" title="Location is off">
              {`${firstName} can’t see you on the map. Allow location for Book My Tech in Settings.`}
            </Notice>
          ) : (
            <Text variant="bodySm" style={styles.strong}>
              {eta
                ? `About ${eta.minutes} min away · ${eta.miles.toFixed(1)} mi`
                : sharing === 'unavailable'
                  ? 'Couldn’t get your position'
                  : 'Finding your position…'}
            </Text>
          )}
          <Text variant="caption" color="textMuted">
            Your position is shared only while you’re on the way, and only while this screen is
            open.
          </Text>
        </Card>
      )}

      {status === 'confirmed' && (
        <View style={styles.row}>
          <Card style={styles.fact}>
            <Text variant="caption" color="textMuted">
              When
            </Text>
            <Text variant="bodySm" style={styles.strong}>
              {booking.scheduled_at
                ? `${formatLondon(new Date(booking.scheduled_at), { weekday: 'short', day: 'numeric', month: 'short' })} · ${booking.slot_window ?? time(booking.scheduled_at)}`
                : 'To be confirmed'}
            </Text>
          </Card>
          <Card style={styles.fact}>
            <Text variant="caption" color="textMuted">
              Distance
            </Text>
            <Text variant="bodySm" style={styles.strong}>
              {extras?.distanceMiles != null ? `${extras.distanceMiles.toFixed(1)} mi from base` : '—'}
            </Text>
          </Card>
        </View>
      )}

      {status !== 'completed' && customerCard}

      {status === 'en_route' && (
        <View style={styles.section}>
          <Overline>Quick replies</Overline>
          <View style={styles.chips}>
            {['I’m 10 minutes away', 'Running 15 min late', 'Pulling into your street'].map((reply) => (
              <Pressable
                key={reply}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/jobs/[id]/messages', params: { id, draft: reply } })
                }
              >
                <Pill tone="outline" large>
                  {reply}
                </Pill>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {!!booking.special_instructions?.trim() && active && (
        <Card style={styles.notes}>
          <Text variant="caption" color="textSecondary" style={styles.strong}>
            Customer notes
          </Text>
          <Text color="textSecondary">“{booking.special_instructions.trim()}”</Text>
        </Card>
      )}

      {(status === 'in_progress' || photos.length > 0) && (
        <View style={styles.section}>
          <Overline>Photos</Overline>
          <View style={styles.photos}>
            {photos.map((photo) => (
              <Pressable
                key={photo.id}
                disabled={!active}
                accessibilityRole="imagebutton"
                accessibilityLabel="Job photo. Hold to remove"
                onLongPress={() =>
                  Alert.alert('Remove this photo?', undefined, [
                    { text: 'Keep', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: () => void run('photo', () => removePhoto(photo.id)),
                    },
                  ])
                }
              >
                <Image source={{ uri: photo.url }} style={styles.photo} contentFit="cover" />
              </Pressable>
            ))}
            {active && (
              <Pressable
                style={[styles.photo, styles.addPhoto]}
                disabled={busy !== null}
                accessibilityRole="button"
                accessibilityLabel="Add a photo"
                onPress={() =>
                  Alert.alert('Add a photo', undefined, [
                    { text: 'Take a photo', onPress: () => void addPhoto('camera') },
                    { text: 'Choose from library', onPress: () => void addPhoto('library') },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
              >
                {busy === 'photo' ? (
                  <ActivityIndicator color={Palette.blue} />
                ) : (
                  <>
                    <Icon icon={Camera} size={DetailSizing.rowIcon} strokeWidth={2} color={Palette.blue} />
                    <Text variant="caption" color="blue" style={styles.strong}>
                      Add
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
          {active && photos.length > 0 && (
            <Text variant="caption" color="textMuted">
              Hold a photo to remove it.
            </Text>
          )}
        </View>
      )}

      {checklists.map((checklist) => {
        const left = checklist.progress.total - checklist.progress.answered;
        return (
          <Card key={checklist.key} selected={status === 'in_progress' && left > 0} style={styles.rowCard}>
            <IconTile icon={ClipboardCheck} tone={left === 0 ? 'success' : 'brand'} />
            <View style={styles.grow}>
              <Text variant="bodySm" style={styles.strong}>
                {checklist.name}
              </Text>
              <Text variant="caption" color="textSecondary">
                {left === 0
                  ? `All ${checklist.progress.total} items answered`
                  : `${checklist.progress.answered} of ${checklist.progress.total} answered`}
                {checklist.progress.fails > 0 ? ` · ${checklist.progress.fails} failed` : ''}
                {checklist.progress.advisories > 0 ? ` · ${checklist.progress.advisories} advisory` : ''}
              </Text>
            </View>
            <Button
              size="sm"
              variant={left === 0 ? 'secondary' : 'primary'}
              onPress={() =>
                router.push({ pathname: '/jobs/[id]/inspect', params: { id, key: checklist.key } })
              }
            >
              {status !== 'in_progress' ? 'View' : left === 0 ? 'Review' : checklist.progress.answered ? 'Continue' : 'Start'}
            </Button>
          </Card>
        );
      })}

      {status === 'in_progress' && checklists.length > 0 && (
        <Input
          label="Vehicle mileage"
          value={mileage}
          onChangeText={setMileageText}
          placeholder="48210"
          keyboardType="number-pad"
          helper="Needed before you can complete a job with a checklist."
          labelAction={
            <Text
              variant="caption"
              color="blue"
              style={styles.strong}
              accessibilityRole="button"
              onPress={busy ? undefined : () => void saveMileage()}
            >
              {busy === 'mileage' ? 'Saving…' : 'Save'}
            </Text>
          }
        />
      )}

      {parts.length > 0 && active && (
        <Card style={styles.stack}>
          <Text variant="caption" color="textSecondary" style={styles.strong}>
            Parts · {parts.length}
          </Text>
          {parts.map((part) => (
            <View key={part.id} style={styles.between}>
              <View style={styles.grow}>
                <Text variant="bodySm">
                  {part.part_name}
                  {part.quantity > 1 ? ` × ${part.quantity}` : ''}
                </Text>
                <Text
                  variant="caption"
                  color="blue"
                  style={styles.strong}
                  accessibilityRole="button"
                  onPress={
                    busy
                      ? undefined
                      : () =>
                          void run('part', () =>
                            setPartSourcing(part.id, part.sourcing === 'bmt' ? 'self' : 'bmt'),
                          )
                  }
                >
                  {part.sourcing === 'bmt' ? 'BMT-sourced · switch to my own' : 'My own · switch to BMT-sourced'}
                </Text>
                <View style={styles.line}>
                  <Text variant="caption" color="textMuted">
                    {PART_STATUS[part.status] ?? part.status}
                  </Text>
                  {(() => {
                    const step = nextPartStep(part);
                    return (
                      step && (
                        <Text
                          variant="caption"
                          color="blue"
                          style={styles.strong}
                          accessibilityRole="button"
                          onPress={
                            busy ? undefined : () => void run('part', () => setPartStatus(part.id, step.status))
                          }
                        >
                          · {step.label}
                        </Text>
                      )
                    );
                  })()}
                </View>
              </View>
              <Text variant="bodySm" style={styles.strong}>
                {formatPence(part.total_pence)}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {status !== 'cancelled' && (faults.length > 0 || active) && (
        <View style={styles.section}>
          <Overline>Faults found</Overline>
          {faults.map((fault) => (
            <Card key={fault.id} style={styles.stack}>
              <View style={styles.between}>
                <Pill tone={fault.severity === 'urgent' ? 'error' : 'pending'}>
                  {fault.severity === 'urgent' ? 'Urgent' : 'Advisory'}
                </Pill>
                {!!fault.quote_id && (
                  <Text variant="caption" color="textMuted">
                    Quoted
                  </Text>
                )}
              </View>
              <Text variant="bodySm">{fault.description}</Text>
              {!fault.quote_id && (
                <View style={styles.row}>
                  {(status === 'in_progress' || status === 'completed') && !openQuote && (
                    <Button
                      size="sm"
                      variant="secondary"
                      style={styles.grow}
                      onPress={() =>
                        router.push({
                          pathname: '/jobs/[id]/quote',
                          params: {
                            id,
                            kind: status === 'completed' ? 'follow_on' : 'now',
                            faultId: fault.id,
                            fault: fault.description,
                          },
                        })
                      }
                    >
                      Quote for this
                    </Button>
                  )}
                  {active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      style={styles.grow}
                      disabled={busy !== null}
                      onPress={() => void run('fault', () => removeFault(fault.id))}
                    >
                      Remove
                    </Button>
                  )}
                </View>
              )}
            </Card>
          ))}
          {active && (
            <Button
              fullWidth
              variant="secondary"
              iconLeft={TriangleAlert}
              onPress={() => router.push({ pathname: '/jobs/[id]/fault', params: { id } })}
            >
              Note a fault
            </Button>
          )}
        </View>
      )}

      {quotes.length > 0 && (
        <View style={styles.section}>
          <Overline>Extra work quoted</Overline>
          {quotes.map((quote) => (
            <Card key={quote.id} style={styles.rowCard}>
              <IconTile icon={Wrench} tone={quote.status === 'approved' ? 'success' : 'accent'} />
              <View style={styles.grow}>
                <Text variant="bodySm" style={styles.strong} numberOfLines={1}>
                  {quote.title ?? (quote.kind === 'now' ? 'Extra work on this visit' : 'Return visit')}
                </Text>
                <Text variant="caption" color="textMuted">
                  {formatPence(quote.total_pence)} · {QUOTE_STATUS[quote.status] ?? quote.status}
                </Text>
              </View>
              {quote.status === 'sent' && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy !== null}
                  onPress={() => void run('quote', () => withdrawQuote(quote.id))}
                >
                  Withdraw
                </Button>
              )}
            </Card>
          ))}
        </View>
      )}

      {status === 'in_progress' && !openQuote && (
        <Button
          fullWidth
          variant="secondary"
          iconLeft={Plus}
          onPress={() => router.push({ pathname: '/jobs/[id]/quote', params: { id } })}
        >
          Add extra work & quote customer
        </Button>
      )}

      {status === 'in_progress' && (
        <Button
          fullWidth
          variant="secondary"
          iconLeft={FilePenLine}
          onPress={() => router.push({ pathname: '/jobs/[id]/revise', params: { id } })}
        >
          Change what’s being done
        </Button>
      )}

      {status === 'in_progress' && (
        <Card tone="warn" style={styles.stack}>
          <View style={styles.line}>
            <Icon icon={Clock} size={DetailSizing.rowIcon} strokeWidth={2} color={Palette.warningText} />
            <Text color="warningText" style={styles.strong}>
              Can’t finish today?
            </Text>
          </View>
          <Text variant="caption" color="warningText">
            1. Trim today’s job to what you’ll get done — the customer approves and pays only for
            that.{'\n'}2. Complete and charge as normal.{'\n'}3. Quote the rest as a return visit
            from the finished job.
          </Text>
          <View style={styles.row}>
            <Button
              size="sm"
              variant="secondary"
              style={styles.grow}
              onPress={() => router.push({ pathname: '/jobs/[id]/revise', params: { id } })}
            >
              Trim today’s job
            </Button>
            <Button size="sm" variant="secondary" style={styles.grow} onPress={() => router.push('/running-late')}>
              Move my later jobs
            </Button>
          </View>
        </Card>
      )}

      {status === 'in_progress' && (
        <Notice
          icon={extras?.completeBlocker ? TriangleAlert : CircleCheck}
          tone="warn"
          title={extras?.completeBlocker ? 'Not ready to complete yet' : 'Ready to finish?'}
        >
          {extras?.completeBlocker ??
            `Completing takes ${charge} from ${firstName}’s pre-authorised card.`}
        </Notice>
      )}

      {moneyCard}

      {status === 'completed' && !openQuote && (
        <Button
          fullWidth
          variant="secondary"
          iconLeft={Plus}
          onPress={() =>
            router.push({ pathname: '/jobs/[id]/quote', params: { id, kind: 'follow_on' } })
          }
        >
          Quote a return visit
        </Button>
      )}

      {status === 'completed' && (
        <Button
          fullWidth
          variant="secondary"
          iconLeft={MessageCircle}
          onPress={() => router.push({ pathname: '/jobs/[id]/messages', params: { id } })}
        >
          Messages
        </Button>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: Spacing[6] },
  intro: { gap: Spacing[1] },
  actions: { gap: Spacing[2] },
  stack: { gap: Spacing[3], padding: Spacing[4] },
  section: { gap: Spacing[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4] },
  line: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing[2] },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing[3] },
  grow: { flex: 1, gap: Spacing[1] / 2 },
  strong: { fontWeight: '700' },
  centred: { textAlign: 'center' },
  divider: { height: 1, backgroundColor: Palette.borderSubtle },
  avatar: {
    width: Sizing.iconTile.lg.box,
    height: Sizing.iconTile.lg.box,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.tile,
    backgroundColor: Palette.blueTintStrong,
  },
  fact: { flex: 1, gap: Spacing[1], padding: Spacing[3] },
  notes: { gap: Spacing[1], padding: Spacing[4] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  photo: { width: JobPhotos.size, height: JobPhotos.size, borderRadius: Radius.tile },
  addPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
    borderWidth: DetailSizing.addPhotoBorder,
    borderStyle: 'dashed',
    borderColor: Palette.blue,
    backgroundColor: Palette.blueTint,
  },
  done: { alignItems: 'center', gap: Spacing[3] },
  dark: {
    gap: Spacing[2],
    padding: Spacing[5],
    borderRadius: Radius.card,
    backgroundColor: Palette.surfaceDarkDeep,
  },
  darkDivider: { height: 1, backgroundColor: OnDark.fill },
});
