import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Banknote,
  CalendarClock,
  FolderLock,
  KeyRound,
  Landmark,
  LifeBuoy,
  LogOut,
  Mail,
  Star,
  UserRound,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AccountRow } from '@/components/account-row';
import { Stars } from '@/components/stars';
import { Avatar, Button, Card, Overline, Pill, Screen, Text } from '@/components/ui';
import { Sizing, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { documentsAlert, fetchDocuments } from '@/lib/documents';
import {
  fetchCompletedJobs,
  fetchEarnings,
  formatPounds,
  monthSummary,
  stripeDashboardUrl,
  type EarningsRemote,
} from '@/lib/earnings';
import { DAY_NAMES, loadWorkingWeek, WEEK_ORDER, type WorkingDay } from '@/lib/mechanic';
import { fetchReviews, reviewStats, type ReviewStats } from '@/lib/reviews';
import { SPECIALISMS } from '@/lib/specialisms';

/**
 * The Account hub — mockup frame 1 of `05-account-earnings.html`. Every row
 * leads to its own screen; the subtitles are a glance at each: this month's
 * earnings, the bank account, the next document to expire, the working week.
 * The account-level links the mockup does not show (email, password, delete)
 * are the customer app's, because a mechanic can sign up in the app and Apple
 * requires in-app deletion.
 */
export default function AccountScreen() {
  const router = useRouter();
  const { user, profile, mechanic, fullName, signOut } = useAuth();

  const [week, setWeek] = useState<WorkingDay[] | null>(null);
  const [monthPence, setMonthPence] = useState<number | null>(null);
  const [remote, setRemote] = useState<EarningsRemote | null>(null);
  const [docsLine, setDocsLine] = useState<ReturnType<typeof documentsAlert> | undefined>();
  const [reviews, setReviews] = useState<ReviewStats | null>(null);
  const [openingStripe, setOpeningStripe] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const mechanicId = mechanic?.id;
      if (!mechanicId) return;

      void loadWorkingWeek(mechanicId).then((result) => active && result.ok && setWeek(result.days));
      void fetchCompletedJobs().then((jobs) => active && jobs && setMonthPence(monthSummary(jobs).earnedPence));
      void fetchEarnings().then((result) => active && result.ok && setRemote(result.earnings));
      void fetchDocuments().then((rows) => active && setDocsLine(rows ? documentsAlert(rows) : null));
      void fetchReviews().then((rows) => active && rows && setReviews(reviewStats(rows)));

      return () => {
        active = false;
      };
    }, [mechanic?.id]),
  );

  async function openStripe() {
    if (!mechanic?.stripe_payouts_enabled) {
      router.push('/payouts');
      return;
    }
    setOpeningStripe(true);
    const result = await stripeDashboardUrl();
    setOpeningStripe(false);
    if (result.ok) await WebBrowser.openBrowserAsync(result.url);
    else Alert.alert("Couldn't open Stripe", result.error);
  }

  const name = fullName ?? user?.email ?? 'Your account';
  const rating = mechanic?.rating ?? 0;
  const jobCount = mechanic?.job_count ?? 0;
  const verified = !!mechanic?.approved_at;

  const availabilityLine = [
    week ? describeDays(week) : null,
    mechanic ? `${mechanic.service_radius_miles} mi radius` : null,
    mechanic ? countLabel(SPECIALISMS.filter((s) => mechanic.specialisms.includes(s.slug)).length, 'specialism') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const earningsLine =
    monthPence === null ? 'Paid per job, straight to your bank' : `${formatPounds(monthPence)} this month · paid per job`;

  const bankLine = !mechanic?.stripe_payouts_enabled
    ? 'Set up payouts to take jobs'
    : remote?.account
      ? `${remote.account.bankName} •• ${remote.account.last4}`
      : 'Manage in your Stripe dashboard';

  const reviewsLine = reviews?.count
    ? `${reviews.average?.toFixed(1)} average across ${countLabel(reviews.count, 'review')}`
    : 'No reviews yet';

  return (
    <Screen title="Account" back={false}>
      <Card elevated style={styles.hero}>
        <Avatar name={name} source={profile?.avatar_url} size={Sizing.iconTile.xl.box} rounded />
        <View style={styles.heroText}>
          <Text variant="h3" numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.heroRating}>
            <Stars rating={rating} />
            <Text variant="caption" style={styles.strong}>
              {rating ? rating.toFixed(1) : 'New'} · {countLabel(jobCount, 'job')}
            </Text>
          </View>
          <View style={styles.heroPills}>
            {verified && <Pill tone="success">Verified</Pill>}
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <Overline>You & the job</Overline>
        <Card padded={false}>
          <AccountRow
            icon={UserRound}
            title="Profile"
            subtitle="Your bio, photo & base postcode"
            onPress={() => router.push('/profile')}
          />
          <AccountRow
            icon={CalendarClock}
            title="Availability & specialisms"
            subtitle={availabilityLine || 'Where and when you work'}
            divided
            onPress={() => router.push('/availability')}
          />
          <AccountRow
            icon={FolderLock}
            tone={docsLine ? 'pending' : 'accent'}
            title="Documents"
            subtitle={docsLine ? docsLine.label : docsLine === null ? 'All up to date' : 'ID, insurance & qualifications'}
            badge={docsLine ? <Pill tone={docsLine.tone === 'danger' ? 'error' : 'pending'}>{docsLine.badge}</Pill> : undefined}
            divided
            onPress={() => router.push('/documents')}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Overline>Money</Overline>
        <Card padded={false}>
          <AccountRow
            icon={Banknote}
            tone="success"
            title="Earnings & payouts"
            subtitle={earningsLine}
            onPress={() => router.push('/earnings')}
          />
          <AccountRow
            icon={Landmark}
            title="Bank account"
            subtitle={openingStripe ? 'Opening Stripe…' : bankLine}
            divided
            onPress={() => void openStripe()}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Overline>Support</Overline>
        <Card padded={false}>
          <AccountRow icon={Star} title="Reviews" subtitle={reviewsLine} onPress={() => router.push('/reviews')} />
          <AccountRow
            icon={LifeBuoy}
            title="Help centre"
            subtitle="Answers, and a line to the team"
            divided
            onPress={() => router.push('/help')}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Overline>Sign-in</Overline>
        <Card padded={false}>
          <AccountRow
            icon={Mail}
            title="Email address"
            subtitle={user?.email ?? ''}
            onPress={() => router.push('/account/email')}
          />
          <AccountRow
            icon={KeyRound}
            title="Password"
            subtitle="Change the password you sign in with"
            divided
            onPress={() => router.push('/account/password')}
          />
        </Card>
      </View>

      <Button fullWidth variant="ghost" iconLeft={LogOut} onPress={signOut}>
        Sign out
      </Button>

      <Pressable
        onPress={() => router.push('/account/delete')}
        accessibilityRole="button"
        hitSlop={Spacing[2]}
        style={({ pressed }) => [styles.deleteLink, pressed && styles.pressed]}
      >
        <Text color="danger" style={styles.strong}>
          Delete account
        </Text>
      </Pressable>
    </Screen>
  );
}

/** "Mon–Sat" for a run of days, "Mon, Wed, Fri" otherwise, "No days set" for none. */
function describeDays(week: readonly WorkingDay[]): string {
  const ordered = WEEK_ORDER.map((day) => week.find((row) => row.dayOfWeek === day)).filter(
    (row): row is WorkingDay => !!row,
  );
  const active = ordered.map((row, index) => (row.isActive ? index : -1)).filter((index) => index >= 0);
  if (!active.length) return 'No days set';
  const first = active[0]!;
  const last = active[active.length - 1]!;
  const contiguous = last - first + 1 === active.length;
  const nameAt = (index: number) => DAY_NAMES[ordered[index]!.dayOfWeek];
  if (contiguous) return first === last ? nameAt(first) : `${nameAt(first)}–${nameAt(last)}`;
  return active.map(nameAt).join(', ');
}

function countLabel(count: number, noun: string) {
  return `${count.toLocaleString('en-GB')} ${noun}${count === 1 ? '' : 's'}`;
}

const styles = StyleSheet.create({
  section: { gap: Spacing[2] },
  strong: { fontWeight: '700' },
  pressed: { opacity: 0.7 },

  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  heroText: { flex: 1, gap: Spacing[1] },
  heroRating: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  heroPills: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[1] },

  deleteLink: { alignSelf: 'center', paddingVertical: Spacing[2] },
});
