import { api, rateLimitMessage } from '@/lib/api';
import { supabase } from '@/lib/supabase';

/**
 * What customers said. The list is a direct read under RLS, joined to the
 * booking for the customer's name as the web page does; a reply is written by
 * the CRM, because `reviews` gives a mechanic no write at all.
 */

export interface Review {
  id: string;
  rating: number;
  tags: string[];
  comment: string | null;
  mechanic_response: string | null;
  created_at: string;
  customerName: string | null;
}

/** The CRM's cap on a reply. */
export const MAX_REPLY_CHARS = 1000;

export async function fetchReviews(): Promise<Review[] | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, tags, comment, mechanic_response, created_at, booking:bookings(customer_name)')
    .order('created_at', { ascending: false });
  if (error) return null;

  return data.map((row) => {
    // A many-to-one join arrives as one object; the types allow an array.
    const booking = Array.isArray(row.booking) ? row.booking[0] : row.booking;
    return {
      id: row.id,
      rating: row.rating,
      tags: row.tags,
      comment: row.comment,
      mechanic_response: row.mechanic_response,
      created_at: row.created_at,
      customerName: booking?.customer_name ?? null,
    };
  });
}

/** "Priya S" — a first name and an initial, the way the public profile shows them. */
export function shortName(fullName: string | null): string {
  if (!fullName?.trim()) return 'A customer';
  const [first = '', ...rest] = fullName.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0]!.toUpperCase()}` : first;
}

export interface ReviewStats {
  average: number | null;
  count: number;
  replied: number;
  /** Replied ÷ count, whole percent; null with no reviews. */
  repliedPercent: number | null;
  /** How many of each star, 1–5. */
  byRating: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function reviewStats(reviews: readonly Review[]): ReviewStats {
  const byRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  let total = 0;
  let replied = 0;
  for (const review of reviews) {
    total += review.rating;
    if (review.mechanic_response?.trim()) replied += 1;
    const star = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    byRating[star] += 1;
  }
  const count = reviews.length;
  return {
    average: count ? Math.round((total / count) * 10) / 10 : null,
    count,
    replied,
    repliedPercent: count ? Math.round((replied / count) * 100) : null,
    byRating,
  };
}

/** Post or edit the reply under a review. */
export async function respondToReview(
  reviewId: string,
  response: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const text = response.trim();
  if (!text) return { ok: false, error: 'Write a reply first.' };
  if (text.length > MAX_REPLY_CHARS) {
    return { ok: false, error: `Keep your reply under ${MAX_REPLY_CHARS} characters.` };
  }

  const result = await api.post(`/mechanic/reviews/${encodeURIComponent(reviewId)}/response`, {
    response: text,
  });
  if (result.ok) return { ok: true };
  return {
    ok: false,
    error: result.status === 429 ? rateLimitMessage(result.retryAfter) : result.error,
  };
}

/** "Yesterday", "3 days ago", "2 weeks ago", then the date. */
export function reviewedAgo(createdAt: string, now = Date.now()): string {
  const days = Math.floor((now - new Date(createdAt).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 28) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  return new Date(createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London',
  });
}
