import * as Location from 'expo-location';

import { supabase } from '@/lib/supabase';

/**
 * Live location, shared with the customer only while the mechanic is on the
 * way. `mechanic_locations` holds one row per mechanic — the latest fix, not a
 * trail — and the customer can read it only while their booking is `en_route`.
 * The mechanic owns the row outright under RLS, so this writes direct.
 */
export interface LatLng {
  lat: number;
  lng: number;
}

export interface Fix extends LatLng {
  speedMps: number | null;
}

export type SharingState = 'off' | 'starting' | 'sharing' | 'denied' | 'unavailable';

let watcher: Location.LocationSubscription | null = null;

export async function startSharing(
  mechanicId: string,
  onFix: (fix: Fix) => void,
): Promise<Exclude<SharingState, 'off' | 'starting'>> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return 'denied';

  await stopWatching();

  try {
    watcher = await Location.watchPositionAsync(
      // A fix every ten seconds or fifty metres: smooth enough on the
      // customer's map, and the customer app treats a minute's silence as stale.
      { accuracy: Location.Accuracy.High, timeInterval: 10_000, distanceInterval: 50 },
      ({ coords }) => {
        onFix({ lat: coords.latitude, lng: coords.longitude, speedMps: coords.speed });

        // `updated_at` is stamped by a trigger; sending one would be ignored.
        void supabase.from('mechanic_locations').upsert({
          mechanic_id: mechanicId,
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy_m: coords.accuracy,
          heading_deg: coords.heading,
          speed_mps: coords.speed,
          sharing_enabled: true,
        });
      },
    );
    return 'sharing';
  } catch {
    return 'unavailable';
  }
}

async function stopWatching() {
  watcher?.remove();
  watcher = null;
}

/**
 * Stop, and take the position back. Deleting the row rather than switching
 * `sharing_enabled` off: a delete is the change the customer's app hears about
 * straight away, and there is nothing left on file afterwards.
 */
export async function stopSharing(mechanicId: string) {
  await stopWatching();
  await supabase.from('mechanic_locations').delete().eq('mechanic_id', mechanicId);
}

/** Great-circle distance in metres. */
export function distanceMetres(a: LatLng, b: LatLng) {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Straight-line travel time scaled up for roads — the same estimate the
 * customer app shows, so both sides of the job see the same number. A reading
 * below walking pace (sat at a junction) falls back to a ~20 mph urban average.
 */
export function estimateEta(from: LatLng, to: LatLng, speedMps: number | null) {
  const metres = distanceMetres(from, to) * 1.3;
  const speed = speedMps != null && speedMps >= 3 ? speedMps : 9;
  return {
    minutes: Math.max(1, Math.round(metres / speed / 60)),
    miles: metres / 1609.344,
  };
}
