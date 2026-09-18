import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * `app.json` is the config; this file only layers on what must not be
 * committed. Today that is the Google Maps key Android needs for the en-route
 * map (iOS uses Apple Maps and needs none).
 *
 * The key comes from `GOOGLE_MAPS_ANDROID_API_KEY` — `.env` for a local
 * prebuild, an EAS environment variable for a cloud build. Without it Android
 * still builds and runs; the map is just grey. Create it in Google Cloud with
 * only "Maps SDK for Android" enabled and restrict it to the package name
 * `uk.co.thedigicraft.bmt.mechanic` and the SHA-1 fingerprints EAS shows under
 * `eas credentials -p android`.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();

  return {
    ...(config as ExpoConfig),
    android: {
      ...config.android,
      ...(mapsKey
        ? { config: { ...config.android?.config, googleMaps: { apiKey: mapsKey } } }
        : {}),
    },
  };
};
