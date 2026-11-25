import { Env } from '@/lib/env';

/**
 * Put a document straight into Supabase Storage with a one-time token the CRM
 * signed for it — step 2 of 3 (see the CRM's lib/storage/direct-doc-upload.ts).
 *
 * Documents don't go through the CRM's own upload route any more because that
 * runs on Vercel, which refuses a request body over 4.5 MB before the CRM sees
 * it — and a scanned PDF is often bigger. Photos are shrunk on the phone
 * (`shrinkForUpload`); a PDF can't be.
 *
 * A plain `fetch` rather than supabase-js's `uploadToSignedUrl`: that calls
 * `FormData.has()`, which React Native's FormData doesn't have, so it throws
 * before sending. The token in the query is the whole grant — it can write
 * this one path and nothing else; the anon key only gets the request past the
 * Supabase gateway.
 */
export async function putToSignedUpload(
  bucket: string,
  signed: { path: string; token: string },
  file: { uri: string; mimeType: string; fileName: string },
  { upsert }: { upsert: boolean },
): Promise<boolean> {
  const form = new FormData();
  form.append('cacheControl', '3600');
  // React Native's FormData takes a file as this object, not a Blob. The part's
  // type is what Storage records, and what the CRM checks on confirm.
  form.append('file', {
    uri: file.uri,
    type: file.mimeType,
    name: file.fileName,
  } as unknown as Blob);

  const path = signed.path.split('/').map(encodeURIComponent).join('/');
  const url =
    `${Env.supabaseUrl}/storage/v1/object/upload/sign/${bucket}/${path}` +
    `?token=${encodeURIComponent(signed.token)}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        apikey: Env.supabaseAnonKey,
        'x-upsert': String(upsert),
      },
      body: form,
    });
    if (!response.ok && __DEV__) {
      console.warn('[upload] storage refused', response.status, (await response.text()).slice(0, 300));
    }
    return response.ok;
  } catch (err) {
    if (__DEV__) console.warn('[upload] storage unreachable', err);
    return false;
  }
}
