import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { Palette } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

/**
 * Live location, shared with the customer only while the mechanic is on the
 * way. `mechanic_locations` holds one row per mechanic — the latest fix, not a
 * trail — and the customer can read it only while their booking is `en_route`.
 * The mechanic owns the row outright under RLS, so this writes direct.
 *
 * Runs in the BACKGROUND: a mechanic on the way is following their sat-nav,
 * not looking at this app, and the customer's map has to keep moving. It is a
 * background task (`startLocationUpdatesAsync`), but one that only ever starts
 * while the app is open — which is what lets it run on the ordinary "While
 * Using the App" permission rather than "Always":
 *   - iOS keeps it going under the `location` background mode, with the blue
 *     location pill showing so the mechanic can see it is on;
 *   - Android runs it as a location foreground service, with a notification.
 * No `ACCESS_BACKGROUND_LOCATION`, so no Play background-location review.
 * Swiping the app away ends it on iOS; the customer's map then says it is
 * waiting, rather than showing a stale pin.
 */
export interface LatLng {
  lat: number;
  lng: number;
}

export interface Fix extends LatLng {
  speedMps: number | null;
}

export type SharingState = 'off' | 'starting' | 'sharing' | 'denied' | 'unavailable';

const JOURNEY_TASK = 'bmt-journey-location';

/**
 * At most one write this often. The task is asked for a fix whether or not the
 * mechanic is moving (`distanceInterval: 0`) — a stationary mechanic who only
 * reported on movement went silent, and the customer app hides the marker
 * after 60 seconds of that, the read policy after five minutes. Every write
 * touches `updated_at` and emits the Realtime event the customer listens for.
 */
const WRITE_EVERY_MS = 10_000;

/**
 * How often the task checks there is still a job on the way. The job screen
 * stops sharing when the job moves on, but the job can move on without that
 * screen open — the mechanic went back to the list, the office changed it —
 * and nothing else would stop a background task.
 */
const CHECK_EVERY_MS = 2 * 60_000;

let lastWriteAt = 0;
let lastCheckAt = 0;
const listeners = new Set<(fix: Fix) => void>();

/** Each fix as it arrives, for the job screen's own map. Returns the unsubscribe. */
export function subscribeToFixes(listener: (fix: Fix) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Defined at module scope, as TaskManager requires: when the OS delivers a fix
// to a backgrounded app the task has to exist before any screen renders.
// Imported for that reason from the root layout.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  JOURNEY_TASK,
  async ({ data, error }) => {
    if (error || !data?.locations?.length) return;
    const { coords } = data.locations[data.locations.length - 1]!;

    for (const listener of listeners) {
      listener({ lat: coords.latitude, lng: coords.longitude, speedMps: coords.speed });
    }

    const now = Date.now();
    if (now - lastWriteAt < WRITE_EVERY_MS) return;
    lastWriteAt = now;

    // `mechanics.id` is the auth user — the same identity the RLS policies
    // check — read from the persisted session so this works with no screen up.
    const { data: auth } = await supabase.auth.getSession();
    const mechanicId = auth.session?.user.id;
    if (!mechanicId) {
      await stopTracking();
      return;
    }

    if (now - lastCheckAt >= CHECK_EVERY_MS) {
      lastCheckAt = now;
      const { count, error: checkError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('mechanic_id', mechanicId)
        .eq('status', 'en_route');
      // Only a definite "none" stops it: a failed read in a signal blackspot
      // must not end sharing halfway down the road.
      if (!checkError && count === 0) {
        await stopSharing(mechanicId);
        return;
      }
    }

    // `updated_at` is stamped by a trigger; sending one would be ignored.
    const { error: saveError } = await supabase.from('mechanic_locations').upsert({
      mechanic_id: mechanicId,
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy_m: coords.accuracy,
      heading_deg: coords.heading,
      speed_mps: coords.speed,
      sharing_enabled: true,
    });
    // Logged, not surfaced: the next fix retries it anyway.
    if (saveError && __DEV__) console.warn('[location] fix not saved:', saveError.message);
  },
);

/**
 * Start sharing, from the job screen while the app is open. Idempotent: the
 * screen calls it on every visit while the job is on the way, and a task that
 * is already running carries on untouched.
 */
export async function startSharing(): Promise<Exclude<SharingState, 'off' | 'starting'>> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return 'denied';

  try {
    if (await Location.hasStartedLocationUpdatesAsync(JOURNEY_TASK)) return 'sharing';

    lastWriteAt = 0;
    lastCheckAt = 0;
    await Location.startLocationUpdatesAsync(JOURNEY_TASK, {
      accuracy: Location.Accuracy.High,
      // Android: a fix every ten seconds, moving or not. iOS ignores the
      // interval; with no distance filter it reports continuously instead.
      timeInterval: 10_000,
      distanceInterval: 0,
      activityType: Location.ActivityType.AutomotiveNavigation,
      // iOS would otherwise power down at a long red light and stop reporting.
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Sharing your location',
        notificationBody: 'Your customer can see you on the map while you’re on the way.',
        notificationColor: Palette.blue,
        killServiceOnDestroy: true,
      },
    });
    return 'sharing';
  } catch (err) {
    if (__DEV__) console.warn('[location] could not start sharing:', err);
    return 'unavailable';
  }
}

async function stopTracking() {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(JOURNEY_TASK)) {
      await Location.stopLocationUpdatesAsync(JOURNEY_TASK);
    }
  } catch {
    // Already stopped, or the task manager is unavailable: nothing to undo.
  }
}

/**
 * Stop, and take the position back. Deleting the row rather than switching
 * `sharing_enabled` off: a delete is the change the customer's app hears about
 * straight away, and there is nothing left on file afterwards.
 */
export async function stopSharing(mechanicId: string) {
  await stopTracking();
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
