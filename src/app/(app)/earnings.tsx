import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ExternalLink, Landmark } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AccountRow } from '@/components/account-row';
import { EarningsChartView } from '@/components/earnings-chart';
import { Kpi } from '@/components/kpi';
import { Button, Card, Overline, Pill, Screen, Text } from '@/components/ui';
import { BrandGradient, OnDark, Palette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  dailySeries,
  fetchCompletedJobs,
  fetchEarnings,
  fetchLedgerBalance,
  formatPounds,
  formatRate,
  monthSummary,
  PERIODS,
  seriesLabels,
  stripeDashboardUrl,
  type CompletedJob,
  type EarningsRemote,
  type PeriodKey,
} from '@/lib/earnings';
import { formatDay } from '@/lib/london-time';
import { formatPence } from '@/lib/offers';

/**
 * Earnings — mockup frame 2. The sums are the app's own, from its completed
 * jobs; Stripe's side (the bank account, the transfers) comes from the CRM.
 * There is no "next payout": mechanics are paid per job on completion, so the
 * hero shows the balance BMT holds instead, which is normally nil.
 */
export default function EarningsScreen() {
  const router = useRouter();
  const { mechanic } = useAuth();

  const [jobs, setJobs] = useState<CompletedJob[] | null>(null);
  const [remote, setRemote] = useState<EarningsRemote | null>(null);
  const [balance, setBalance] = useState<EarningsRemote['balance'] | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [opening, setOpening] = useState(false);

  const load = useCallback(async () => {
    const [completed, earnings, ledger] = await Promise.all([
      fetchCompletedJobs(),
      fetchEarnings(),
      fetchLedgerBalance(),
    ]);
    setJobs(completed ?? []);
    if (earnings.ok) {
      setRemote(earnings.earnings);
      setRemoteError(null);
    } else {
      setRemoteError(earnings.error);
    }
    setBalance(earnings.ok ? earnings.earnings.balance : ledger);
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

  async function openDashboard() {
    setOpening(true);
    const result = await stripeDashboardUrl();
    setOpening(false);
    if (result.ok) await WebBrowser.openBrowserAsync(result.url);
    else Alert.alert("Couldn't open Stripe", result.error);
  }

  const month = jobs ? monthSummary(jobs) : null;
  const days = PERIODS.find((p) => p.key === period)?.days ?? 30;
  const points = jobs ? dailySeries(jobs, days) : [];
  const rate = remote?.commissionRate ?? 0.15;
  const payoutsSetUp = !!mechanic?.stripe_payouts_enabled;

  return (
    <Screen
      title="Earnings"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
    >
      <LinearGradient
        colors={[...BrandGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroBlock}>
            <Text variant="overline" color={OnDark.textMuted}>
              This month
            </Text>
            <Text variant="display" color="textInverse">
              {month ? formatPounds(month.earnedPence) : '—'}
            </Text>
            <Text variant="caption" color={OnDark.textMuted}>
              {month
                ? `Projected end of ${month.monthLabel} · ${formatPounds(month.projectedPence)}`
                : 'Adding up your jobs…'}
            </Text>
          </View>
          {month?.changePercent !== null && month?.changePercent !== undefined && (
            <Pill tone="onDark">
              {`${month.changePercent >= 0 ? '+' : ''}${month.changePercent}% vs ${month.lastMonthLabel}`}
            </Pill>
          )}
        </View>

        <View style={styles.heroRule} />

        <View style={styles.heroTop}>
          <View style={styles.heroBlock}>
            <Text variant="caption" color={OnDark.textMuted}>
              {balance && balance.balancePence < 0 ? 'Being recovered' : 'Held by Book My Tech'}
            </Text>
            <Text variant="bodySm" color="textInverse" style={styles.strong}>
              {balance ? formatPence(Math.abs(balance.balancePence)) : '—'}
              {balance && balance.balancePence === 0 ? ' · all paid out' : ''}
            </Text>
          </View>
          <View style={[styles.heroBlock, styles.heroRight]}>
            <Text variant="caption" color={OnDark.textMuted}>
              To
            </Text>
            <Text variant="mono" color="textInverse">
              {remote?.account ? `${remote.account.bankName} •• ${remote.account.last4}` : payoutsSetUp ? 'Your bank' : 'Not set up'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.kpis}>
        <Kpi label="Jobs" value={month ? String(month.jobs) : '—'} />
        <Kpi label="Avg" value={month?.avgPence != null ? formatPounds(month.avgPence) : '—'} />
        <Kpi label="Fee" value={formatRate(rate)} />
        <Kpi label="Rating" value={mechanic?.rating ? mechanic.rating.toFixed(1) : '—'} />
      </View>

      <Card>
        <View style={styles.chartHead}>
          <Text variant="caption" color="textSecondary" style={styles.strong}>
            Daily earnings
          </Text>
          <View style={styles.periods}>
            {PERIODS.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => setPeriod(option.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: option.key === period }}
              >
                <Pill tone={option.key === period ? 'dark' : 'neutral'}>{option.label}</Pill>
              </Pressable>
            ))}
          </View>
        </View>
        {jobs ? (
          <EarningsChartView points={points} labels={seriesLabels(points)} />
        ) : (
          <ActivityIndicator color={Palette.blue} />
        )}
      </Card>

      <View style={styles.section}>
        <View style={styles.payoutsHead}>
          <Overline>Payouts</Overline>
          {remote?.payoutsLive ? (
            <Pill tone="success" dot>
              Live via Stripe
            </Pill>
          ) : null}
        </View>

        {!payoutsSetUp && (
          <Card tone="warn">
            <Text variant="bodySm" color="warningText" style={styles.strong}>
              Payouts aren&rsquo;t set up yet
            </Text>
            <Text variant="caption" color="warningText">
              Connect a bank account with Stripe to start taking jobs. Each job is paid the moment
              it&rsquo;s completed.
            </Text>
            <Button size="sm" iconLeft={Landmark} onPress={() => router.push('/payouts')}>
              Set up payouts
            </Button>
          </Card>
        )}

        {payoutsSetUp && remoteError && !remote && (
          <Text variant="bodySm" color="textMuted">
            {remoteError}
          </Text>
        )}

        {remote && remote.payouts.length === 0 && (
          <Text variant="bodySm" color="textMuted">
            {remote.payoutsLive
              ? 'No payouts yet. Your first completed job pays out the same day.'
              : 'Payouts start once Stripe has verified your account.'}
          </Text>
        )}

        {remote && remote.payouts.length > 0 && (
          <Card padded={false}>
            {remote.payouts.map((payout, index) => (
              <View key={payout.id} style={[styles.payout, index > 0 && styles.divided]}>
                <View style={styles.grow}>
                  <Text variant="bodySm" style={styles.strong}>
                    {formatDay(new Date(payout.at))}
                  </Text>
                  {!!payout.description && (
                    <Text variant="caption" color="textMuted" numberOfLines={1}>
                      {payout.description}
                    </Text>
                  )}
                </View>
                <View style={styles.payoutRight}>
                  <Text variant="bodySm" style={styles.strong}>
                    {formatPence(payout.amountPence)}
                  </Text>
                  <Pill tone={payout.status === 'paid' ? 'success' : 'pending'}>
                    {payout.status === 'paid' ? 'Paid' : 'Pending'}
                  </Pill>
                </View>
              </View>
            ))}
          </Card>
        )}

        {payoutsSetUp && (
          <Card padded={false}>
            <AccountRow
              icon={ExternalLink}
              title="Stripe dashboard"
              subtitle={opening ? 'Opening…' : 'Every transfer itemised, and your bank details'}
              onPress={() => void openDashboard()}
            />
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing[2] },
  strong: { fontWeight: '700' },
  grow: { flex: 1, gap: Spacing[1] },
  divided: { borderTopWidth: 1, borderTopColor: Palette.borderSubtle },

  hero: { borderRadius: Radius.card, padding: Spacing[4], gap: Spacing[3] },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing[3] },
  heroBlock: { gap: Spacing[1], flexShrink: 1 },
  heroRight: { alignItems: 'flex-end' },
  heroRule: { height: 1, backgroundColor: OnDark.border },

  kpis: { flexDirection: 'row', gap: Spacing[2] },

  chartHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  periods: { flexDirection: 'row', gap: Spacing[2] },

  payoutsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  payoutRight: { alignItems: 'flex-end', gap: Spacing[1] },
});
