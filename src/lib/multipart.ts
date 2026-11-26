/**
 * Send a multipart body — a photo or a document — without `fetch`.
 *
 * From SDK 57 the global `fetch` is Expo's (`expo/fetch`), not React
 * Native's, and it cannot send React Native's `{ uri, name, type }` file
 * parts: its FormData encoder throws "Unsupported FormDataPart
 * implementation" before a byte leaves the phone. In build 8 no photo
 * upload reached the CRM at all, and our API client reported the throw as
 * "Couldn't reach Book My Tech".
 *
 * `XMLHttpRequest` is still React Native's own, whose networking module
 * streams a `{ uri }` part straight from the file and writes the multipart
 * boundary itself. So uploads go through that; everything else stays on
 * `fetch`. Don't set a Content-Type header: the boundary would be missing.
 */

export interface MultipartResponse {
  ok: boolean;
  status: number;
  /** Where the request ended up, after any redirect. */
  url: string;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}

export function sendMultipart(
  method: 'POST' | 'PUT',
  url: string,
  {
    headers = {},
    body,
    signal,
  }: { headers?: Record<string, string>; body: FormData; signal?: AbortSignal },
): Promise<MultipartResponse> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);

    const onAbort = () => xhr.abort();
    signal?.addEventListener('abort', onAbort);
    const done = () => signal?.removeEventListener('abort', onAbort);

    xhr.onload = () => {
      done();
      const text = xhr.responseText ?? '';
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        url: xhr.responseURL || url,
        headers: { get: (name) => xhr.getResponseHeader(name) },
        text: async () => text,
      });
    };
    // The same failure `fetch` gives, so callers handle both alike.
    xhr.onerror = () => {
      done();
      reject(new TypeError('Network request failed'));
    };
    xhr.ontimeout = xhr.onerror;
    xhr.onabort = () => {
      done();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    xhr.send(body);
  });
}
