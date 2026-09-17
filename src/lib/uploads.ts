import { api, rateLimitMessage } from '@/lib/api';

export interface PickedFile {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}

/** The CRM's cap on evidence photos, for a dispute, a dispute reply or a case. */
export const MAX_EVIDENCE_PHOTOS = 6;

/**
 * One evidence photo, as multipart, to `/mechanic/disputes/photos` or
 * `/mechanic/cases/photos`. The bucket takes no direct writes; the CRM returns
 * the public URL to attach to whatever is sent next.
 */
export async function uploadEvidence(
  kind: 'disputes' | 'cases',
  file: PickedFile,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const form = new FormData();
  // React Native's FormData takes a file as this object, not a Blob.
  form.append('file', {
    uri: file.uri,
    type: file.mimeType ?? 'image/jpeg',
    name: file.fileName ?? 'photo.jpg',
  } as unknown as Blob);

  const response = await api.upload<{ url: string }>(`/mechanic/${kind}/photos`, form);
  if (response.ok) return { ok: true, url: response.data.url };
  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
  };
}
