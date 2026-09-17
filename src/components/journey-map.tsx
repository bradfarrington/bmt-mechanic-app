import { MapPin, Navigation } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Icon } from '@/components/ui';
import { DetailSizing, Palette, Radius } from '@/constants/theme';
import type { LatLng } from '@/lib/location';

export interface JourneyMapProps {
  /** The job. */
  destination: LatLng;
  /** The mechanic's own position, once there is a fix. */
  position: LatLng | null;
}

/**
 * The mechanic's drive to the job — themselves and the customer's pin, the
 * mirror of what the customer is watching.
 *
 * Apple Maps on iOS, Google on Android via react-native-maps' default provider;
 * the Android build needs a Google Maps key in the config plugin before it
 * shows anything but a grey tile.
 */
export function JourneyMap({ destination, position }: JourneyMapProps) {
  const map = useRef<MapView>(null);

  useEffect(() => {
    if (!position) return;
    map.current?.fitToCoordinates(
      [
        { latitude: position.lat, longitude: position.lng },
        { latitude: destination.lat, longitude: destination.lng },
      ],
      {
        edgePadding: {
          top: DetailSizing.mapFramePadding,
          right: DetailSizing.mapFramePadding,
          bottom: DetailSizing.mapFramePadding,
          left: DetailSizing.mapFramePadding,
        },
        animated: true,
      },
    );
  }, [position, destination]);

  return (
    <MapView
      ref={map}
      style={styles.map}
      pointerEvents="none"
      initialRegion={{
        latitude: destination.lat,
        longitude: destination.lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }}
    >
      <Marker coordinate={{ latitude: destination.lat, longitude: destination.lng }}>
        <View style={[styles.pin, styles.destination]}>
          <Icon icon={MapPin} size={DetailSizing.mapPinIcon} strokeWidth={2.4} color={Palette.textInverse} />
        </View>
      </Marker>
      {position && (
        <Marker coordinate={{ latitude: position.lat, longitude: position.lng }}>
          <View style={[styles.pin, styles.me]}>
            <Icon icon={Navigation} size={DetailSizing.mapPinIcon} strokeWidth={2.4} color={Palette.textInverse} />
          </View>
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { height: DetailSizing.mapHeight, borderRadius: Radius.tile, overflow: 'hidden' },
  pin: {
    width: DetailSizing.mapPin,
    height: DetailSizing.mapPin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: DetailSizing.mapPinRing,
    borderColor: Palette.surfaceCard,
  },
  destination: { backgroundColor: Palette.surfaceDark },
  me: { backgroundColor: Palette.blue },
});
