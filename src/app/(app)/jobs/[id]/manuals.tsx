import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ChoiceList } from '@/components/choice-list';
import { Notice, Overline, Screen, Text } from '@/components/ui';
import { Palette, Spacing } from '@/constants/theme';
import { fetchManuals, type Manuals } from '@/lib/technical';

/**
 * The manufacturer's repair manuals for the job's vehicle — the list. Tapping
 * one opens it on `manual`.
 */
export default function ManualsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Manuals | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchManuals(id).then((result) => {
      if (!active) return;
      if (result.ok) setData(result.data);
      else setError(result.error);
    });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <Screen title="Repair manuals">
      {error ? (
        <Notice icon={TriangleAlert} tone="danger" title="That didn’t load">
          {error}
        </Notice>
      ) : !data ? (
        <ActivityIndicator color={Palette.blue} style={styles.loading} />
      ) : !data.matched ? (
        <Notice icon={TriangleAlert} title="No manuals for this vehicle">
          We couldn’t match this vehicle to the manufacturer data, so there are no manuals to show
          for it.
        </Notice>
      ) : (
        <View style={styles.section}>
          {!!data.vehicle && <Overline>{data.vehicle}</Overline>}
          {data.manuals.length === 0 ? (
            <Text color="textMuted">No repair manuals available for this variant.</Text>
          ) : (
            <ChoiceList
              items={data.manuals.map((manual) => ({
                key: String(manual.storyId),
                icon: BookOpen,
                label: manual.name,
                onPress: () =>
                  router.push({
                    pathname: '/jobs/[id]/manual',
                    params: { id, storyId: String(manual.storyId), name: manual.name },
                  }),
              }))}
            />
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: Spacing[6] },
  section: { gap: Spacing[2] },
});
