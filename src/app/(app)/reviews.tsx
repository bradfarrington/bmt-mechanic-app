import { useFocusEffect } from 'expo-router';
import { MessageSquareReply, Star } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { Stars } from '@/components/stars';
import { Avatar, Button, Card, IconTile, Input, Overline, Pill, Screen, Text } from '@/components/ui';
import { Palette, Sizing, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  fetchReviews,
  MAX_REPLY_CHARS,
  respondToReview,
  reviewedAgo,
  reviewStats,
  shortName,
  type Review,
} from '@/lib/reviews';

/**
 * Reviews — mockup frame 6. The list is the mechanic's own rows under RLS;
 * a reply goes through the CRM, which owns every write to `reviews`. The
 * star filter is the web page's.
 */
export default function ReviewsScreen() {
  const { mechanic } = useAuth();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [filter, setFilter] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setReviews(await fetchReviews());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const stats = reviews ? reviewStats(reviews) : null;
  const shown = reviews?.filter((review) => filter === null || Math.round(review.rating) === filter) ?? [];

  return (
    <Screen
      title="Reviews"
      avoidKeyboard
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
    >
      <Card elevated style={styles.hero}>
        <Text variant="display">{stats?.average != null ? stats.average.toFixed(1) : '—'}</Text>
        <Stars rating={stats?.average ?? 0} large />
        <Text color="textSecondary">
          {stats?.count ? `Based on ${stats.count} review${stats.count === 1 ? '' : 's'}` : 'No reviews yet'}
        </Text>
        <View style={styles.rule} />
        <View style={styles.stats}>
          <Stat value={String(mechanic?.job_count ?? 0)} label="Total jobs" />
          <Stat value={String(stats?.count ?? 0)} label="Reviewed" />
          <Stat value={stats?.repliedPercent != null ? `${stats.repliedPercent}%` : '—'} label="Replied to" />
        </View>
      </Card>

      {stats && stats.count > 0 && (
        <View style={styles.filters}>
          <Pressable onPress={() => setFilter(null)} accessibilityRole="button" accessibilityState={{ selected: filter === null }}>
            <Pill tone={filter === null ? 'dark' : 'neutral'}>All</Pill>
          </Pressable>
          {([5, 4, 3, 2, 1] as const).map((star) => (
            <Pressable
              key={star}
              onPress={() => setFilter(filter === star ? null : star)}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === star }}
            >
              <Pill tone={filter === star ? 'dark' : 'neutral'}>{`${star}★ · ${stats.byRating[star]}`}</Pill>
            </Pressable>
          ))}
        </View>
      )}

      {!reviews && <ActivityIndicator color={Palette.blue} />}

      {reviews?.length === 0 && (
        <Card elevated style={styles.empty}>
          <IconTile icon={Star} size="xl" />
          <Text color="textSecondary" style={styles.centre}>
            Customers are asked to review each job once it&rsquo;s done. Yours will show up here.
          </Text>
        </Card>
      )}

      {shown.length > 0 && <Overline>{filter ? `${filter}-star reviews` : 'Latest'}</Overline>}

      {shown.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          replying={replyingTo === review.id}
          onReply={() => setReplyingTo(review.id)}
          onDone={async () => {
            setReplyingTo(null);
            await load();
          }}
          onCancel={() => setReplyingTo(null)}
        />
      ))}
    </Screen>
  );
}

function ReviewCard({
  review,
  replying,
  onReply,
  onDone,
  onCancel,
}: {
  review: Review;
  replying: boolean;
  onReply: () => void;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(review.mechanic_response ?? '');
  const [sending, setSending] = useState(false);
  const name = shortName(review.customerName);

  async function send() {
    setSending(true);
    const result = await respondToReview(review.id, draft);
    setSending(false);
    if (result.ok) await onDone();
    else Alert.alert("That reply didn't send", result.error);
  }

  return (
    <Card style={styles.review}>
      <View style={styles.reviewHead}>
        <View style={styles.reviewer}>
          <Avatar name={name} size={Sizing.iconTile.md.box} tint={review.rating} rounded />
          <View style={styles.reviewerText}>
            <Text variant="bodySm" style={styles.strong}>
              {name}
            </Text>
            <Stars rating={review.rating} />
          </View>
        </View>
        <Text variant="caption" color="textMuted">
          {reviewedAgo(review.created_at)}
        </Text>
      </View>

      {!!review.comment && <Text color="textSecondary">&ldquo;{review.comment}&rdquo;</Text>}

      {review.tags.length > 0 && (
        <View style={styles.tags}>
          {review.tags.map((tag) => (
            <Pill key={tag} tone="neutral">
              {tag}
            </Pill>
          ))}
        </View>
      )}

      {replying ? (
        <View style={styles.replyForm}>
          <Input
            label={review.mechanic_response ? 'Edit your reply' : 'Your reply'}
            value={draft}
            onChangeText={setDraft}
            placeholder={`Thanks ${name.split(' ')[0]} — glad it's sorted.`}
            rows={3}
            maxLength={MAX_REPLY_CHARS}
            helper="Shown under the review on your public profile."
            autoFocus
          />
          <View style={styles.replyActions}>
            <Button variant="ghost" size="sm" disabled={sending} onPress={onCancel}>
              Cancel
            </Button>
            <Button size="sm" loading={sending} disabled={!draft.trim()} onPress={() => void send()}>
              {review.mechanic_response ? 'Save reply' : 'Send reply'}
            </Button>
          </View>
        </View>
      ) : review.mechanic_response ? (
        <Pressable onPress={onReply} accessibilityRole="button" accessibilityLabel="Edit your reply">
          <Card tone="tint" style={styles.reply}>
            <Text variant="caption" color="textSecondary" style={styles.strong}>
              Your reply
            </Text>
            <Text variant="caption">{review.mechanic_response}</Text>
          </Card>
        </Pressable>
      ) : (
        <Button variant="secondary" size="sm" iconLeft={MessageSquareReply} onPress={onReply} style={styles.replyButton}>
          Reply
        </Button>
      )}
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.strong}>{value}</Text>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strong: { fontWeight: '700' },
  centre: { textAlign: 'center' },

  hero: { alignItems: 'center', gap: Spacing[2] },
  rule: { alignSelf: 'stretch', height: 1, backgroundColor: Palette.borderSubtle, marginVertical: Spacing[1] },
  stats: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch' },
  stat: { alignItems: 'center', gap: Spacing[1] },

  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  empty: { alignItems: 'center', gap: Spacing[3] },

  review: { gap: Spacing[3] },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewer: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  reviewerText: { gap: Spacing[1] },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  reply: { gap: Spacing[1], padding: Sizing.compactPadding },
  replyButton: { alignSelf: 'flex-start' },
  replyForm: { gap: Spacing[2] },
  replyActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing[2] },
});
