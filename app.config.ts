import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * `app.json` is the config; this file only layers on what Android needs from
 * outside the repo.
 *
 * - **Google Maps key** (`GOOGLE_MAPS_ANDROID_API_KEY`) for the en-route map.
 *   iOS uses Apple Maps and needs none. `.env` for a local prebuild, an EAS
 *   environment variable for a cloud build. Create it in Google Cloud with
 *   only "Maps SDK for Android" enabled and restrict it to the package name
 *   `uk.co.thedigicraft.bmt.mechanic` and the SHA-1 fingerprints of the Play
 *   app-signing key and the EAS upload key.
 * - **Firebase config** (`google-services.json`) so Android can get an Expo
 *   push token (FCM). EAS supplies it as the file variable
 *   `GOOGLE_SERVICES_JSON`; for a local prebuild put
 *   `GOOGLE_SERVICES_JSON=./google-services.json` in `.env`. The FCM V1
 *   service-account key that lets Expo *send* lives on EAS under the
 *   project's Android credentials, not here.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON?.trim();

  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
      ...(mapsKey
        ? { config: { ...config.android?.config, googleMaps: { apiKey: mapsKey } } }
        : {}),
    },
  };
};
