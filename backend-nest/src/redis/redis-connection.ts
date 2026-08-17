import type { RedisOptions } from 'ioredis';

type ParsedRedisUrl = {
  host: string;
  port: number;
  password?: string;
  username?: string;
};

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
