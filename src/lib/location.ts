import * as Location from 'expo-location';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

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
let heartbeat: ReturnType<typeof setInterval> | null = null;

/**
 * How often the last fix is re-sent while the mechanic isn't moving.
 *
 * The watcher below only fires on movement: iOS ignores `timeInterval`
 * altogether and Android needs both conditions met, so a mechanic sat in
 * traffic, at a junction, or still on the drive gets one fix and then
 * silence. The customer app hides the marker after a minute of that and the
 * read policy hides the row after five, so the customer saw "Waiting for your
 * mechanic's location…" while sharing was on. Re-sending touches `updated_at`
 * (the trigger stamps it), which keeps the row readable and emits a Realtime
 * event — comfortably inside the customer app's 60-second cut-off.
 */
const HEARTBEAT_MS = 20_000;

type LocationRow = Database['public']['Tables']['mechanic_locations']['Insert'];

function save(row: LocationRow) {
  // `updated_at` is stamped by a trigger; sending one would be ignored.
  void supabase
    .from('mechanic_locations')
    .upsert(row)
    .then(({ error }) => {
      // Logged, not surfaced: the next fix or heartbeat retries it anyway.
      if (error && __DEV__) console.warn('[location] fix not saved:', error.message);
    });
}

export async function startSharing(
  mechanicId: string,
  onFix: (fix: Fix) => void,
): Promise<Exclude<SharingState, 'off' | 'starting'>> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return 'denied';

  await stopWatching();

  let last: LocationRow | null = null;
  let lastAt = 0;

  try {
    watcher = await Location.watchPositionAsync(
      // A fix every ten seconds or fifty metres while moving — smooth enough on
      // the customer's map. Standing still is covered by the heartbeat.
      { accuracy: Location.Accuracy.High, timeInterval: 10_000, distanceInterval: 50 },
      ({ coords }) => {
        onFix({ lat: coords.latitude, lng: coords.longitude, speedMps: coords.speed });

        last = {
          mechanic_id: mechanicId,
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy_m: coords.accuracy,
          heading_deg: coords.heading,
          speed_mps: coords.speed,
          sharing_enabled: true,
        };
        lastAt = Date.now();
        save(last);
      },
    );
    heartbeat = setInterval(() => {
      // Only when the watcher has gone quiet — while driving, real fixes keep
      // the row fresh. Quiet means standing still, so zero the speed: the
      // customer's ETA then uses the urban average rather than whatever the
      // last moving fix reported.
      if (last && Date.now() - lastAt >= HEARTBEAT_MS) save({ ...last, speed_mps: 0 });
    }, HEARTBEAT_MS / 2);
    return 'sharing';
  } catch {
    return 'unavailable';
  }
}

async function stopWatching() {
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
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
