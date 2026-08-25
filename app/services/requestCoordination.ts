/**
 * Shared client request coordination: in-flight dedupe + HTTP 429 backoff.
 * Keeps existing data on rate limits; no React Query/SWR.
 */

const inflight = new Map<string, Promise<unknown>>();

/** Global pause after 429 so unrelated feed callers wait instead of storming. */
let rateLimitedUntilMs = 0;

export function resetRequestCoordination() {
  inflight.clear();
  rateLimitedUntilMs = 0;
}

export function getRateLimitedUntil(): number {
  return rateLimitedUntilMs;
}

export function isRateLimited(now = Date.now()): boolean {
  return now < rateLimitedUntilMs;
}

export function msUntilRateLimitClears(now = Date.now()): number {
  return Math.max(0, rateLimitedUntilMs - now);
}

export function noteRateLimited(untilMs: number) {
  if (untilMs > rateLimitedUntilMs) rateLimitedUntilMs = untilMs;
}

export function parseRetryAfterMs(
  header: string | null | undefined,
  bodyRetry?: unknown,
  fallbackMs = 60_000,
): number {
  if (header) {
    const asInt = parseInt(header, 10);
    if (!Number.isNaN(asInt) && asInt > 0) return asInt * 1000;
    const asDate = Date.parse(header);
    if (!Number.isNaN(asDate)) return Math.max(1000, asDate - Date.now());
  }
  if (typeof bodyRetry === 'number' && bodyRetry > 0) {
    // API may send seconds or ms; treat small values as seconds.
    return bodyRetry < 1000 ? bodyRetry * 1000 : bodyRetry;
  }
  return fallbackMs;
}

export function noteRateLimitFromResponse(
  res: { status: number; headers: { get(name: string): string | null } },
  body?: { retryAfter?: unknown },
  fallbackMs = 60_000,
): number | null {
  if (res.status !== 429) return null;
  const waitMs = parseRetryAfterMs(res.headers.get('Retry-After'), body?.retryAfter, fallbackMs);
  noteRateLimited(Date.now() + waitMs);
  return waitMs;
}

/**
 * If the same key is already running, await that promise instead of starting another.
 */
export function dedupeInflight<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = factory().finally(() => {
    if (inflight.get(key) === promise) inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

/**
 * Deduped GET that materializes the body once so every waiter can read JSON safely.
 */
export async function dedupeGetResponse(
  key: string,
  factory: () => Promise<Response>,
): Promise<Response> {
  const shared = await dedupeInflight(key, async () => {
    const res = await factory();
    const buffer = await res.arrayBuffer();
    return {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
      headers: res.headers,
      buffer,
    };
  });

  return new Response(shared.buffer.slice(0), {
    status: shared.status,
    statusText: shared.statusText,
    headers: shared.headers,
  });
}

/** Exponential backoff delay (ms), capped; respects active 429 window. */
export function feedRetryDelayMs(attempt: number, baseMs = 3_000, capMs = 60_000): number {
  const exp = Math.min(capMs, baseMs * Math.pow(2, Math.max(0, attempt)));
  return Math.max(exp, msUntilRateLimitClears());
}
