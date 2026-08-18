import IORedis, { RedisOptions } from 'ioredis';

type ParsedRedisUrl = {
  host: string;
  port: number;
  password?: string;
  username?: string;
};

export type SharedRedisKind =
  | 'default'
  | 'bullmq'
  | 'subscriber'
  | 'listener-sub';

const sharedClients = new Map<string, IORedis>();

function parseRedisUrl(raw: string): ParsedRedisUrl | null {
  try {
    const parsed = new URL(raw);
    if (!parsed.hostname) return null;
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password
        ? decodeURIComponent(parsed.password)
        : undefined,
      username: parsed.username
        ? decodeURIComponent(parsed.username)
        : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Shared Redis connection options.
 * Prefers REDIS_URL (Render Key Value) and falls back to HOST/PORT/PASSWORD.
 */
export function redisConnection(
  db: number,
  extra: RedisOptions = {},
): RedisOptions {
  const fromUrl = process.env.REDIS_URL?.trim()
    ? parseRedisUrl(process.env.REDIS_URL.trim())
    : null;

  return {
    host: fromUrl?.host || process.env.REDIS_HOST || 'localhost',
    port: fromUrl?.port || parseInt(process.env.REDIS_PORT || '6379', 10),
    password: fromUrl?.password || process.env.REDIS_PASSWORD || undefined,
    ...(fromUrl?.username ? { username: fromUrl.username } : {}),
    ...extra,
    db,
  };
}

function clientKey(db: number, kind: SharedRedisKind): string {
  return `${db}:${kind}`;
}

/** One TCP connection per DB/kind per process — reduces Render Redis max-clients pressure. */
export function getSharedRedisClient(
  db: number,
  kind: SharedRedisKind = 'default',
): IORedis {
  const key = clientKey(db, kind);
  const existing = sharedClients.get(key);
  if (existing) return existing;

  const extra: RedisOptions =
    kind === 'bullmq' ||
    kind === 'subscriber' ||
    kind === 'listener-sub'
      ? {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          lazyConnect: kind === 'bullmq' ? false : true,
        }
      : {
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          connectTimeout: 3000,
          commandTimeout: 3000,
          lazyConnect: true,
          retryStrategy(times: number) {
            if (times > 2) return null;
            return Math.min(times * 200, 1000);
          },
        };

  const client = new IORedis(redisConnection(db, extra));
  sharedClients.set(key, client);
  return client;
}

export function duplicateSharedRedisClient(
  db: number,
  kind: SharedRedisKind = 'default',
): IORedis {
  return getSharedRedisClient(db, kind).duplicate();
}

export async function closeSharedRedisClients(): Promise<void> {
  await Promise.all(
    [...sharedClients.values()].map((client) => {
      try {
        client.disconnect();
      } catch {
        /* ignore */
      }
    }),
  );
  sharedClients.clear();
}
