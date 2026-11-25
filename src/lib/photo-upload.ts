import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Longest edge, in pixels, of any photo we upload. Plenty to read a part
 * number or a document, and it lands around 0.5–1 MB as a JPEG.
 */
const MAX_EDGE = 2048;
const QUALITY = 0.7;

export interface UploadablePhoto {
  uri: string;
  mimeType: string;
  fileName: string;
}

/**
 * Shrink a picked photo before it is uploaded.
 *
 * Not an optimisation: uploads go through the CRM on Vercel, which refuses
 * any request body over 4.5 MB before our code sees it — whatever limit the
 * route itself sets. A modern phone's camera original is often bigger than
 * that even at the picker's `quality: 0.7`, and on Android the refusal
 * surfaces as a dropped connection ("Couldn't reach Book My Tech"), not an
 * error anyone can act on.
 *
 * Always re-encoded as JPEG, which also turns an iPhone's HEIC into
 * something the CRM accepts. If the manipulator fails, the original goes up
 * as before rather than the upload failing here.
 */
export async function shrinkForUpload(asset: {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string | null;
  fileName?: string | null;
}): Promise<UploadablePhoto> {
  const base = (asset.fileName ?? `photo-${Date.now()}`).replace(/\.[^.]+$/, '');

  try {
    const context = ImageManipulator.manipulate(asset.uri);
    const { width = 0, height = 0 } = asset;
    // Unknown size: re-encode only, never guess a resize that could upscale.
    if (Math.max(width, height) > MAX_EDGE) {
      context.resize(width >= height ? { width: MAX_EDGE } : { height: MAX_EDGE });
    }
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ compress: QUALITY, format: SaveFormat.JPEG });
    return { uri: saved.uri, mimeType: 'image/jpeg', fileName: `${base}.jpg` };
  } catch (err) {
    if (__DEV__) console.warn('[photo] could not shrink, uploading the original:', err);
    return {
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'image/jpeg',
      fileName: asset.fileName ?? `${base}.jpg`,
    };
  }
}
