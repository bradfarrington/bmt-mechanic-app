import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * Whether this device has been through the welcome carousel.
 *
 * Read once at launch — the root layout holds the splash until it is known, so
 * `/` never flashes sign-in before redirecting to the welcome — then
 * kept in memory. It belongs to the device, not the account: signing out does
 * not bring the carousel back.
 */
const KEY = 'bmt.mechanic.welcome-seen';

/** Null until storage has answered. */
let seen: boolean | null = null;
const listeners = new Set<() => void>();

function set(next: boolean) {
  seen = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function loadWelcomeSeen() {
  AsyncStorage.getItem(KEY).then(
    (value) => set(value === '1'),
    // Unreadable storage skips the carousel rather than showing it on every
    // launch.
    () => set(true),
  );
}

/** `null` while loading, then whether the carousel has been seen. */
export function useWelcomeSeen() {
  return useSyncExternalStore(subscribe, () => seen);
}

export function markWelcomeSeen() {
  set(true);
  AsyncStorage.setItem(KEY, '1').catch(() => {
    // Worst case the carousel shows once more on the next launch.
  });
}
