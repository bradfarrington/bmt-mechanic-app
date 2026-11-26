import { useLocalSearchParams } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { StoryLines } from '@/components/technical';
import { Card, Notice, Screen } from '@/components/ui';
import { Palette, Spacing } from '@/constants/theme';
import { fetchManual, type Manual } from '@/lib/technical';

/** One repair manual: nested steps, remarks and pictures. */
export default function ManualScreen() {
  const { id, storyId, name } = useLocalSearchParams<{ id: string; storyId: string; name?: string }>();
  const [manual, setManual] = useState<Manual | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchManual(id, Number(storyId)).then((result) => {
      if (!active) return;
      if (result.ok) setManual(result.data);
      else setError(result.error);
    });
    return () => {
      active = false;
    };
  }, [id, storyId]);

  return (
    <Screen title={manual?.name ?? name ?? 'Repair manual'}>
      {error ? (
        <Notice icon={TriangleAlert} tone="danger" title="That didn’t load">
          {error}
        </Notice>
      ) : !manual ? (
        <ActivityIndicator color={Palette.blue} style={styles.loading} />
      ) : (
        <Card>
          <StoryLines lines={manual.lines} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: Spacing[6] },
});
