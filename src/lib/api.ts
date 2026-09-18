import { Env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

/**
 * Client for the CRM's `/api/mobile/v1/*` layer.
 *
 * Anything needing a server-only secret (DVLA, HaynesPro, Stripe, the Supabase
 * service-role key) or the CRM's booking side effects (dispatch, email, SMS,
 * credit) goes through here rather than being reimplemented on device. Reads
 * that RLS already covers go direct via `supabase` instead — see
 * docs/00-build-plan.md.
 *
 * Versioned, because a mobile binary cannot be force-updated — an old install
 * keeps calling whatever path it shipped with, potentially for years.
 */
const API_VERSION = 'v1';

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      status: number;
      /** Seconds to wait, from the `Retry-After` header on a 429. */
      retryAfter?: number;
    };

/**
 * - `required` — 401 locally if there is no session, without a round trip
 * - `optional` — send the token when signed in, proceed as a guest otherwise.
 *   The CRM meters signed-in callers on their own bucket, which is fairer than
 *   per-IP when several customers share one carrier NAT address.
 * - `none` — never send a token
 */
export type AuthMode = 'required' | 'optional' | 'none';

interface RequestOptions {
  auth?: AuthMode;
  body?: unknown;
  /**
   * A multipart body instead of JSON — photo uploads. The content type is left
   * to `fetch`, which writes the boundary in; setting it by hand produces a
   * multipart header with no boundary that the server cannot parse.
   */
  form?: FormData;
  /**
   * Extra request headers. An anonymous multipart route has neither a Bearer
   * token nor the JSON content type to stop a web page posting to it, so the
   * CRM asks for an app-only header instead — see `lib/application.ts`.
   */
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  { auth = 'required', body, form, headers: extra, signal }: RequestOptions = {},
): Promise<ApiResult<T>> {
  // The CRM requires this exact type. Refusing CORS is not enough on its own:
  // JSON is not a CORS-simple content type, so demanding it is what forces a
  // preflight the CRM never answers — which is what stops a web page POSTing
  // `text/plain` and creating accounts or spending DVLA credit from a
  // victim's browser.
  const headers: Record<string, string> = {
    ...(form ? {} : { 'Content-Type': 'application/json' }),
    ...extra,
  };

  if (auth !== 'none') {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (auth === 'required') {
      return { ok: false, error: 'You need to be signed in.', status: 401 };
    }
  }

  const url = `${Env.apiBaseUrl}/api/mobile/${API_VERSION}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
      signal,
    });
  } catch (err) {
    // Silent by default otherwise: the caller gets a friendly string, but
    // nothing reaches the Metro terminal, so a dev has no error to go on.
    if (__DEV__) console.warn(`[api] ${method} ${url} → network error`, err);
    return {
      ok: false,
      error: "Couldn't reach Book My Tech. Check your connection and try again.",
      status: 0,
    };
  }

  const text = await response.text();
  let payload: unknown = null;
  let jsonParsed = false;
  try {
    payload = text ? JSON.parse(text) : null;
    jsonParsed = true;
  } catch {
    // Non-JSON body — most likely an HTML error page from the edge.
  }

  if (!response.ok) {
    const header = response.headers.get('Retry-After');
    const retryAfter = header ? Number(header) : undefined;

    if (__DEV__) {
      // A non-JSON body on a failure almost always means the route isn't there
      // (a Next.js 404 page), not a real API error — call that out, and show a
      // snippet so the terminal has something to act on.
      const hint = jsonParsed
        ? ''
        : ' (non-JSON body — likely a missing route / wrong path)';
      console.warn(
        `[api] ${method} ${url} → ${response.status}${hint}\n` +
          text.slice(0, 300),
      );
    }

    return {
      ok: false,
      error:
        (payload as { error?: string } | null)?.error ??
        'Something went wrong. Please try again.',
      status: response.status,
      retryAfter:
        retryAfter !== undefined && Number.isFinite(retryAfter)
          ? retryAfter
          : undefined,
    };
  }

  // A 2xx is not automatically a success. `fetch` follows redirects silently,
  // so a request bounced to a sign-in page — or sent to the wrong server
  // entirely — arrives here as 200 with an HTML body. Every route under
  // /api/mobile/v1 answers with a JSON object, so anything else is a misrouted
  // request, not data. Passing it on as `data: null` pushes the failure into
  // the caller, which crashes on its first property read instead of showing
  // the customer an error.
  if (!jsonParsed || typeof payload !== 'object' || payload === null) {
    if (__DEV__) {
      const hint =
        response.url && response.url !== url
          ? ` — followed a redirect to ${response.url}; is EXPO_PUBLIC_API_BASE_URL` +
            ' pointing at the CRM?'
          : ' — expected JSON from the CRM';
      console.warn(
        `[api] ${method} ${url} → ${response.status} with a non-JSON body${hint}\n` +
          text.slice(0, 300),
      );
    }

    return {
      ok: false,
      error: 'Something went wrong. Please try again.',
      status: response.status,
    };
  }

  return { ok: true, data: payload as T };
}

/**
 * Paths are relative to `/api/mobile/v1` — call `api.post('/auth/signup')`, not
 * the full path.
 */
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  /** Multipart POST — see `RequestOptions.form`. */
  upload: <T>(path: string, form: FormData, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, form }),
};

/**
 * The CRM answers a *refused* action with HTTP 200 and `{ ok: false, error }`,
 * reserving non-2xx for transport problems. Both read identically to the
 * customer, so they collapse to one shape here.
 *
 * 429 gets its own wording: the action family allows 8 a minute and 40 a day
 * **shared across** cancel, reschedule, review, dispute and hold release —
 * which a customer will not hit by hand, but a stuck retry loop would.
 */
export function unwrapAction<T extends { ok: boolean }>(
  response: ApiResult<T>,
): T | { ok: false; error: string } {
  if (response.ok) return response.data;

  return {
    ok: false,
    error:
      response.status === 429
        ? rateLimitMessage(response.retryAfter)
        : response.error,
  };
}

/** Friendly wording for a rate-limited response. */
export function rateLimitMessage(retryAfter?: number) {
  if (!retryAfter) return 'Too many attempts just now. Wait a moment and try again.';
  if (retryAfter < 60) return `Too many attempts. Try again in ${retryAfter} seconds.`;
  const minutes = Math.ceil(retryAfter / 60);
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}
