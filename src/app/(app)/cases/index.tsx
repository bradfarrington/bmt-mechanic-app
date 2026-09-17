import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, LifeBuoy, Plus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, IconTile, Pill, Screen, Text } from '@/components/ui';
import { Palette, Sizing, Spacing } from '@/constants/theme';
import { CASE_STATUS, fetchCases, type HelpCase } from '@/lib/cases';
import { formatDay } from '@/lib/london-time';

/** Get help — the mechanic's cases with Book My Tech. */
export default function CasesScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<HelpCase[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      void fetchCases().then(setCases);
    }, []),
  );

  return (
    <Screen
      title="Get help"
      footer={
        <Button fullWidth size="xl" iconLeft={Plus} onPress={() => router.push('/cases/new')}>
          Raise a case
        </Button>
      }
    >
      <Text color="textSecondary">
        Raise an issue about a job with the Book My Tech team. Customers never see these.
      </Text>

      {!cases && <ActivityIndicator color={Palette.blue} />}

      {cases?.length === 0 && (
        <Card elevated style={styles.empty}>
          <IconTile icon={LifeBuoy} size="xl" />
          <Text color="textSecondary" style={styles.centred}>
            No cases yet. Payout looks wrong, a customer wasn’t there, a safety worry — raise it
            here.
          </Text>
        </Card>
      )}

      {cases?.map((item) => {
        const status = CASE_STATUS[item.status] ?? { label: item.status, tone: 'neutral' as const };
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/cases/[id]', params: { id: item.id } })}
          >
            <Card style={styles.row}>
              <View style={styles.grow}>
                <Text variant="bodySm" style={styles.strong} numberOfLines={1}>
                  {item.reason_label}
                </Text>
                <Text variant="caption" color="textMuted">
                  {formatDay(new Date(item.created_at))}
                </Text>
              </View>
              <Pill tone={status.tone}>{status.label}</Pill>
              <Icon icon={ChevronRight} size={Sizing.rowChevron} strokeWidth={2} color={Palette.textMuted} />
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[4] },
  grow: { flex: 1, gap: Spacing[1] / 2 },
  strong: { fontWeight: '700' },
  empty: { alignItems: 'center', gap: Spacing[3] },
  centred: { textAlign: 'center' },
});
