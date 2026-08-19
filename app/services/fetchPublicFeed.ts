import { fetchWithTimeout } from '@/services/fetchWithTimeout';

/** Feed GETs should fail fast so the UI can retry; uploads/login keep the longer default. */
export const FEED_TIMEOUT_MS = 12_000;

/** Public feed GET — optional auth; retries without token after 401 (stale session). */
export async function fetchPublicFeed(
  url: string,
  accessToken?: string | null,
  init: RequestInit = {},
  timeoutMs = FEED_TIMEOUT_MS,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let res = await fetchWithTimeout(url, { ...init, headers }, timeoutMs);
  if (res.status === 401 && accessToken) {
    res = await fetchWithTimeout(url, init, timeoutMs);
  }
  return res;
}
