import { fetchWithTimeout } from '@/services/fetchWithTimeout';

/** Public feed GET — optional auth; retries without token after 401 (stale session). */
export async function fetchPublicFeed(
  url: string,
  accessToken?: string | null,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let res = await fetchWithTimeout(url, { ...init, headers });
  if (res.status === 401 && accessToken) {
    res = await fetchWithTimeout(url, init);
  }
  return res;
}
