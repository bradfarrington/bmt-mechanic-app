import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, CircleCheck, Circle, Crown, Percent, Zap, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AccountRow } from '@/components/account-row';
import { Card, Icon, IconTile, Overline, Pill, Screen, Text } from '@/components/ui';
import { GoldGradient, OnDark, Palette, ProScreen, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { fetchPro, formatRate, type ProStatus } from '@/lib/pro';

/**
 * Go Pro — mockup frame 7, on the gold gradient that is reserved for it. The
 * path, the perks and the keep-it rules are printed as the CRM sends them;
 * the screen hard-codes no threshold. Until the route lands it shows the
 * badge and what Pro is for.
 */
export default function ProScreenView() {
  const { mechanic } = useAuth();
  const [pro, setPro] = useState<ProStatus | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchPro().then((result) => {
      if (!active) return;
      if (result.ok) {
        setPro(result.pro);
        setState('ready');
      } else {
        setError(result.error);
        setState(result.missing ? 'missing' : 'error');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const isPro = pro?.isPro ?? mechanic?.is_pro ?? false;
  const toGo = pro ? Math.max(0, pro.progress.jobsNeeded - pro.progress.jobsDone) : null;
  const percent = pro && pro.progress.jobsNeeded > 0
    ? Math.min(100, Math.round((pro.progress.jobsDone / pro.progress.jobsNeeded) * 100))
    : 0;

  return (
    <Screen title={isPro ? 'Pro tier' : 'Go Pro'} contentStyle={styles.page}>
      <LinearGradient colors={[...GoldGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroHead}>
          <Pill tone="onDark">
            {isPro ? 'You are Pro' : toGo === null ? 'Pro tier' : toGo === 1 ? '1 job to go' : `${toGo} jobs to go`}
          </Pill>
          <IconTile icon={Crown} tone="onDark" />
        </View>
        <Text variant="overline" color={OnDark.textMuted}>
          {isPro ? 'Nice work' : "You're on your way"}
        </Text>
        <Text variant="display" color="textInverse">
          Pro tier
        </Text>
        <Text color={OnDark.textStrong}>
          {isPro
            ? 'Lower commission and first look at offers. Keep it by keeping your standards up.'
            : pro
              ? `Complete ${toGo === 1 ? '1 more job' : `${toGo} more jobs`} and unlock lower commission plus priority on offers.`
              : 'Lower commission and priority on offers for mechanics customers keep coming back to.'}
        </Text>

        {pro && !isPro && (
          <>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${percent}%` }]} />
            </View>
            <View style={styles.barLabels}>
              <Text variant="caption" color={OnDark.textStrong} style={styles.strong}>
                {pro.progress.jobsDone} of {pro.progress.jobsNeeded} jobs
              </Text>
              <Text variant="caption" color={OnDark.textStrong} style={styles.strong}>
                {percent}%
              </Text>
            </View>
          </>
        )}
      </LinearGradient>

      {state === 'loading' && <ActivityIndicator color={ProScreen.ink} />}

      {state === 'error' && !!error && (
        <Text variant="bodySm" color="textMuted">
          {error}
        </Text>
      )}

      <View style={styles.section}>
        <Overline>What you get</Overline>
        <Card padded={false}>
          {(pro?.perks ?? DEFAULT_PERKS(mechanic?.is_pro ? 0.12 : 0.15)).map((perk, index) => (
            <AccountRow
              key={perk.title}
              icon={PERK_ICONS[index % PERK_ICONS.length]!}
              tone="pending"
              title={perk.title}
              subtitle={perk.detail}
              divided={index > 0}
            />
          ))}
        </Card>
      </View>

      {pro && pro.keep.length > 0 && (
        <Card>
          <Text variant="caption" color="textSecondary" style={styles.strong}>
            To keep Pro
          </Text>
          <View style={styles.rules}>
            {pro.keep.map((rule) => (
              <View key={rule.label} style={styles.rule}>
                <Icon
                  icon={rule.met ? CircleCheck : Circle}
                  size={Spacing[4]}
                  strokeWidth={2}
                  color={rule.met ? Palette.success : Palette.textDisabled}
                />
                <Text variant="bodySm" style={styles.grow}>
                  {rule.label}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {state === 'missing' && (
        <Text variant="caption" color="textMuted" style={styles.centre}>
          Book My Tech sets who is Pro for now. Your progress will show here once the tier is live.
        </Text>
      )}

      {pro && (
        <Text variant="caption" color="textMuted" style={styles.centre}>
          Standard commission is {formatRate(pro.standardRate)}; Pro is {formatRate(pro.proRate)}.
        </Text>
      )}
    </Screen>
  );
}

const PERK_ICONS: readonly LucideIcon[] = [Percent, Zap, BadgeCheck, Crown];

/** What Pro is for, until the CRM says otherwise. */
function DEFAULT_PERKS(rate: number) {
  return [
    { title: 'Lower commission', detail: `Down from ${formatRate(rate)} on every job.` },
    { title: 'Priority on offers', detail: 'Pro mechanics see jobs before others.' },
    { title: 'Pro badge on your profile', detail: 'Customers see you as a verified Pro.' },
  ];
}

const styles = StyleSheet.create({
  page: { backgroundColor: ProScreen.background },
  section: { gap: Spacing[2] },
  strong: { fontWeight: '700' },
  centre: { textAlign: 'center' },
  grow: { flex: 1 },

  hero: { borderRadius: Radius.card, padding: Spacing[4], gap: Spacing[1] },
  heroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  barTrack: {
    marginTop: Spacing[3],
    height: ProScreen.barHeight,
    borderRadius: ProScreen.barHeight / 2,
    backgroundColor: ProScreen.barTrack,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: ProScreen.barHeight / 2, backgroundColor: Palette.textInverse },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing[2] },

  rules: { gap: Spacing[2], marginTop: Spacing[2] },
  rule: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
});
