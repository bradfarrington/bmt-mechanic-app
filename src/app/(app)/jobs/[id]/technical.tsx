import { useLocalSearchParams } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { DataGroup, DataRows, StoryLines } from '@/components/technical';
import { Card, Notice, Overline, Screen, Text } from '@/components/ui';
import { Palette, Spacing } from '@/constants/theme';
import { fetchTechnicalData, type TechnicalData } from '@/lib/technical';

/**
 * The job vehicle's technical data: adjustments and specifications (torque
 * settings and the like), capacities, and where the VIN and ID plate are.
 */
export default function TechnicalDataScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<TechnicalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchTechnicalData(id).then((result) => {
      if (!active) return;
      if (result.ok) setData(result.data);
      else setError(result.error);
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (error || !data) {
    return (
      <Screen title="Technical data">
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

  if (!data.matched) {
    return (
      <Screen title="Technical data">
        <Notice icon={TriangleAlert} title="No data for this vehicle">
          We couldn’t match this vehicle to the manufacturer data, so there’s nothing to show for
          it.
        </Notice>
      </Screen>
    );
  }

  return (
    <Screen title="Technical data">
      {!!data.vehicle && (
        <Text variant="bodySm" color="textSecondary">
          {data.vehicle}
        </Text>
      )}

      <View style={styles.section}>
        <Overline>Adjustments & specifications</Overline>
        {data.adjustments.length === 0 ? (
          <Text color="textMuted">No adjustment data for this variant.</Text>
        ) : (
          data.adjustments.map((group, index) => <DataGroup key={index} group={group} />)
        )}
      </View>

      <View style={styles.section}>
        <Overline>Capacities</Overline>
        {data.capacities.length === 0 ? (
          <Text color="textMuted">No capacity data for this variant.</Text>
        ) : (
          <Card>
            <DataRows rows={data.capacities} />
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <Overline>VIN & ID plate locations</Overline>
        {data.idLocations.length === 0 ? (
          <Text color="textMuted">No ID-location data for this variant.</Text>
        ) : (
          data.idLocations.map((lines, index) => (
            <Card key={index}>
              <StoryLines lines={lines} />
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: Spacing[6] },
  section: { gap: Spacing[2] },
});
