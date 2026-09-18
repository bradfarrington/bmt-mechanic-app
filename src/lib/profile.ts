import { api, rateLimitMessage } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { PickedFile } from '@/lib/uploads';

/**
 * The mechanic's public face. Name and phone live on `profiles`, the bio on
 * `mechanics`; both are written direct under RLS, exactly as the CRM's
 * `updateProfile` action does under the mechanic's own session. The avatar
 * goes through the CRM: the `avatars` bucket takes no writes from a session.
 *
 * The base postcode is not edited here. BMT sets it from the application and
 * the column's trigger refuses a change from a mechanic's session.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const FAILED = "Couldn't save that. Check your connection and try again.";

/** The CRM's caps — the web form's `maxLength`s. */
export const MAX_NAME_CHARS = 80;
export const MAX_BIO_CHARS = 600;

export async function updateProfile(
  userId: string,
  input: { fullName: string; phone: string; bio: string },
): Promise<ActionResult> {
  const fullName = input.fullName.trim();
  if (!fullName) return { ok: false, error: 'Add your name — customers see it.' };
  if (input.bio.trim().length > MAX_BIO_CHARS) {
    return { ok: false, error: `Keep your bio under ${MAX_BIO_CHARS} characters.` };
  }

  const profileWrite = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone: input.phone.trim() || null })
    .eq('id', userId);
  if (profileWrite.error) return { ok: false, error: FAILED };

  const mechanicWrite = await supabase
    .from('mechanics')
    .update({ bio: input.bio.trim() || null })
    .eq('id', userId);
  return mechanicWrite.error ? { ok: false, error: FAILED } : { ok: true };
}

/** The CRM's `MAX_AVATAR_BYTES` and its accepted types. */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'];

/** A new photo, as multipart. The CRM returns the public URL it wrote to `profiles.avatar_url`. */
export async function uploadAvatar(
  file: PickedFile & { size?: number | null },
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const mime = file.mimeType ?? 'image/jpeg';
  if (!AVATAR_MIME.includes(mime)) return { ok: false, error: 'Use a JPEG, PNG or WebP photo.' };
  if (file.size != null && file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: 'That photo is over 5 MB. Try a smaller one.' };
  }

  const form = new FormData();
  form.append('avatar', {
    uri: file.uri,
    type: mime,
    name: file.fileName ?? 'avatar.jpg',
  } as unknown as Blob);

  const response = await api.upload<{ url: string }>('/mechanic/avatar', form);
  if (response.ok) return { ok: true, url: response.data.url };
  return {
    ok: false,
    error: response.status === 429 ? rateLimitMessage(response.retryAfter) : response.error,
  };
}
