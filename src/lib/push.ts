import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from '@/lib/api';
import type { InboxLink } from '@/lib/inbox';

/**
 * Push notifications — how a mechanic hears about an offer while the app is
 * closed. First to accept wins, so this is the difference between getting the
 * job and reading about it afterwards.
 *
 * - **This app** asks permission in context, gets an Expo push token and hands
 *   it to the CRM; on tap it deep-links to the offer.
 * - **The CRM** stores tokens per mechanic (`/mechanic/devices` — never the
 *   customer `/devices` routes) and pushes from dispatch whenever it creates
 *   an offer.
 *
 * **Expo Go cannot receive remote push.** A development build on a physical
 * device is the minimum; the simulator has no APNs and `Device.isDevice` is
 * what catches that.
 */

// How a notification behaves when it arrives with the app *open*. Banner and
// list rather than the deprecated `shouldShowAlert`; no badge, since the app
// has nothing to count down.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Android 8+ refuses to show anything without a channel. The CRM addresses
 * offer pushes to this exact id.
 */
const OFFERS_CHANNEL = 'offers';
/** Everything that is not a race — tomorrow's running order, the end-of-day recap, back online. */
const UPDATES_CHANNEL = 'updates';

export type PushPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

/**
 * Current permission, without prompting. `unsupported` is a simulator or a
 * build with no EAS project — a state to hide the prompt in, not to explain.
 */
export async function getPushPermission(): Promise<PushPermission> {
  if (!Device.isDevice || !projectId()) return 'unsupported';

  const { status, ios } = await Notifications.getPermissionsAsync();
  return interpret(status, ios?.status);
}

export type RegisterResult =
  | { ok: true; token: string }
  | { ok: false; permission: Exclude<PushPermission, 'granted'> }
  | { ok: false; permission: 'granted'; error: string };

/**
 * Ask (if not yet asked), get a token, and hand it to the CRM.
 *
 * Call this from somewhere the mechanic can see *why* — the end of setup, or
 * Today — never on first launch. A cold permission prompt is the
 * one most likely to be refused, and iOS does not let the app ask twice.
 */
export async function registerForPush(): Promise<RegisterResult> {
  const id = projectId();
  if (!Device.isDevice || !id) return { ok: false, permission: 'unsupported' };

  if (Platform.OS === 'android') {
    // Before the token: Android 13+ wants at least one channel first.
    await Notifications.setNotificationChannelAsync(OFFERS_CHANNEL, {
      name: 'Job offers',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync(UPDATES_CHANNEL, {
      name: 'Your day',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  let { status, ios } = await Notifications.getPermissionsAsync();
  if (interpret(status, ios?.status) === 'undetermined') {
    ({ status, ios } = await Notifications.requestPermissionsAsync());
  }

  const permission = interpret(status, ios?.status);
  if (permission !== 'granted') return { ok: false, permission };

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: id,
    });

    // The CRM is the only place the token is any use — it is what addresses
    // this device from dispatch. A failure here is
    // logged, not surfaced: the mechanic granted permission and that part
    // worked; the rest is retried on the next foreground.
    const saved = await api.post('/mechanic/devices', {
      token,
      platform: Platform.OS,
    });
    if (!saved.ok && __DEV__) {
      console.warn('[push] token not saved to CRM:', saved.error);
    }

    return { ok: true, token };
  } catch (err) {
    return {
      ok: false,
      permission: 'granted',
      error: err instanceof Error ? err.message : 'Could not get a push token.',
    };
  }
}

/**
 * Stop the CRM addressing this device. Called on sign-out, so a shared phone
 * does not keep receiving the previous mechanic's offers. Must run before the
 * session is cleared — the removal call needs the token.
 */
export async function unregisterForPush() {
  const id = projectId();
  if (!Device.isDevice || !id) return;

  try {
    const { status, ios } = await Notifications.getPermissionsAsync();
    if (interpret(status, ios?.status) !== 'granted') return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: id,
    });
    await api.post('/mechanic/devices/remove', { token });
  } catch {
    // Best effort — the CRM also drops a token the moment Expo reports it
    // dead, so a missed removal here is self-healing.
  }
}

/** Where a tapped notification leads. The inbox's links, plus the three that are not inbox rows. */
export type PushLink =
  | InboxLink
  | { type: 'offer'; offerId: string }
  | { type: 'tomorrow'; day?: string }
  | { type: 'recap'; day?: string };

/**
 * The CRM's `data` payload, read defensively. `{ type: 'status' }` and anything
 * unrecognised only need the app opening, so they are not a link.
 */
export function linkFromResponse(
  response: Notifications.NotificationResponse | null | undefined,
): PushLink | null {
  const data = (response?.notification.request.content.data ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof data[key] === 'string' ? (data[key] as string) : null);

  switch (data.type) {
    case 'offer': {
      const offerId = text('offerId');
      return offerId ? { type: 'offer', offerId } : null;
    }
    case 'tomorrow':
      return { type: 'tomorrow', day: text('day') ?? undefined };
    case 'recap':
      return { type: 'recap', day: text('day') ?? undefined };
    case 'message': {
      const id = text('bookingId');
      return id ? { type: 'thread', id } : null;
    }
    case 'job': {
      const id = text('bookingId');
      return id ? { type: 'job', id } : null;
    }
    case 'dispute': {
      const id = text('disputeId');
      return id ? { type: 'dispute', id } : null;
    }
    case 'case': {
      const id = text('caseId');
      return id ? { type: 'case', id } : null;
    }
    case 'earnings':
    case 'reviews':
    case 'documents':
      return { type: data.type };
    default:
      return null;
  }
}

/**
 * The EAS project id, which `getExpoPushTokenAsync` needs to mint a token.
 *
 * Written by `eas init` into `expo.extra.eas.projectId` in app.json. Absent
 * until then, so everything above degrades to
 * `unsupported` rather than throwing on a build that has not been through it.
 */
function projectId(): string | null {
  const fromConfig = Constants.expoConfig?.extra?.eas?.projectId;
  const fromEas = Constants.easConfig?.projectId;
  const id = fromConfig ?? fromEas;
  if (!id && __DEV__) {
    console.warn(
      '[push] No EAS projectId in app.json — run `eas init`. Push is disabled until then.',
    );
  }
  return typeof id === 'string' && id ? id : null;
}

/** iOS reports the real answer under `ios.status`; the root field is generic. */
function interpret(
  status: Notifications.PermissionStatus,
  iosStatus?: Notifications.IosAuthorizationStatus,
): PushPermission {
  if (Platform.OS === 'ios' && iosStatus !== undefined) {
    switch (iosStatus) {
      case Notifications.IosAuthorizationStatus.AUTHORIZED:
      case Notifications.IosAuthorizationStatus.PROVISIONAL:
      case Notifications.IosAuthorizationStatus.EPHEMERAL:
        return 'granted';
      case Notifications.IosAuthorizationStatus.DENIED:
        return 'denied';
      default:
        return 'undetermined';
    }
  }

  switch (status) {
    case Notifications.PermissionStatus.GRANTED:
      return 'granted';
    case Notifications.PermissionStatus.DENIED:
      return 'denied';
    default:
      return 'undetermined';
  }
}
