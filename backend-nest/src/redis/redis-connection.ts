import IORedis, { RedisOptions } from 'ioredis';
import type { ConnectionOptions } from 'bullmq';

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
let bullmqSubscriber: IORedis | null = null;

let redisCircuitOpenUntil = 0;
const REDIS_CIRCUIT_MS = 15_000;

export function isRedisCircuitOpen(): boolean {
  return Date.now() < redisCircuitOpenUntil;
}

export function tripRedisCircuit(): void {
  redisCircuitOpenUntil = Date.now() + REDIS_CIRCUIT_MS;
}

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
    kind === 'bullmq' || kind === 'subscriber' || kind === 'listener-sub'
      ? {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          lazyConnect: kind === 'bullmq' ? false : true,
        }
      : {
          maxRetriesPerRequest: 1,
          enableReadyCheck: false,
          enableOfflineQueue: false,
          connectTimeout: 800,
          commandTimeout: 500,
          lazyConnect: true,
          retryStrategy(times: number) {
            if (times > 1) return null;
            return 150;
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

/**
 * One command connection for all BullMQ queues in this process.
 * Worker/subscriber sockets still duplicate (BullMQ blocking requirement).
 */
export function getBullmqSharedConnection(): ConnectionOptions {
  return getSharedRedisClient(1, 'bullmq') as unknown as ConnectionOptions;
}

/**
 * BullMQ `createClient` hook.
 * - command `client`: reused singleton
 * - `subscriber`: one shared duplicate (pub/sub can multiplex)
 * - `bclient`: unique duplicate per worker (blocking BRPOP cannot be shared)
 */
export function createBullmqClient(
  type: 'client' | 'subscriber' | 'bclient' = 'client',
): ConnectionOptions {
  const shared = getSharedRedisClient(1, 'bullmq');
  if (type === 'client') {
    return shared as unknown as ConnectionOptions;
  }
  if (type === 'subscriber') {
    if (!bullmqSubscriber) {
      bullmqSubscriber = shared.duplicate();
    }
    return bullmqSubscriber as unknown as ConnectionOptions;
  }
  return shared.duplicate() as unknown as ConnectionOptions;
}

export async function closeSharedRedisClients(): Promise<void> {
  if (bullmqSubscriber) {
    try {
      bullmqSubscriber.disconnect();
    } catch {
      /* ignore */
    }
    bullmqSubscriber = null;
  }
  for (const client of sharedClients.values()) {
    try {
      client.disconnect();
    } catch {
      /* ignore */
    }
  }
  sharedClients.clear();
}
