import { Clock, MapPin, Wrench } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, IconTile, Pill, Text } from '@/components/ui';
import { Halo, OfferCard as Tokens, Palette, Spacing } from '@/constants/theme';
import {
  formatPence,
  offeredAgo,
  offerTitle,
  offerVehicle,
  offerWhere,
  type Offer,
} from '@/lib/offers';

export interface OfferCardProps {
  offer: Offer;
  /** `accept` or `decline` while that answer is on its way. */
  busy?: 'accept' | 'decline' | null;
  onOpen: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

/** A live offer in the feed. Fresh ones wear the red urgency halo. */
export function OfferCard({ offer, busy = null, onOpen, onAccept, onDecline }: OfferCardProps) {
  const age = offeredAgo(offer.offeredAt);
  const fresh = age === 'New';

  return (
    <Card style={[styles.card, fresh && styles.fresh]}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${offerTitle(offer)}, ${formatPence(offer.payoutPence)}. View offer`}
        style={styles.summary}
      >
        <View style={styles.head}>
          <IconTile icon={Wrench} tone={fresh ? 'error' : 'accent'} />
          <View style={styles.headCopy}>
            <View style={styles.titleRow}>
              <Text variant="bodySm" style={styles.title} numberOfLines={1}>
                {offerTitle(offer)}
              </Text>
              <Pill tone={fresh ? 'error' : 'neutral'} dot={fresh}>
                {age}
              </Pill>
            </View>
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {offerVehicle(offer)}
              {offer.vehicle.reg ? ' · ' : ''}
              {!!offer.vehicle.reg && (
                <Text variant="monoSm" color="textMuted">
                  {offer.vehicle.reg}
                </Text>
              )}
            </Text>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={[styles.metaItem, styles.grow]}>
            <Icon icon={MapPin} size={Tokens.metaIcon} strokeWidth={2} color={Palette.textMuted} />
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {offerWhere(offer)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon icon={Clock} size={Tokens.metaIcon} strokeWidth={2} color={Palette.textMuted} />
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              {offer.when ?? 'Time to be confirmed'}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.divider} />

      <View style={styles.foot}>
        <View>
          <Text variant="caption" color="textMuted">
            You earn
          </Text>
          <Text variant="h3">{formatPence(offer.payoutPence)}</Text>
        </View>
        <View style={styles.actions}>
          <Button
            size="sm"
            variant="ghost"
            loading={busy === 'decline'}
            disabled={busy !== null}
            onPress={onDecline}
          >
            Decline
          </Button>
          <Button
            size="sm"
            loading={busy === 'accept'}
            disabled={busy !== null}
            onPress={onAccept}
          >
            Accept
          </Button>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing[4], gap: Spacing[3] },
  fresh: {
    borderWidth: 1.5,
    borderColor: Palette.danger,
    boxShadow: `0 0 0 ${Tokens.halo}px ${Halo.urgentRed}`,
  },
  summary: { gap: Spacing[3] },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  headCopy: { flex: 1, gap: Spacing[1] / 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  title: { flexShrink: 1, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  grow: { flex: 1 },
  divider: { height: 1, backgroundColor: Palette.borderSubtle },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
});
