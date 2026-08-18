import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';
import {
  getSharedRedisClient,
  isRedisCircuitOpen,
  tripRedisCircuit,
} from '../redis-connection';

const DEFAULT_TTL = 300;

@Injectable()
export class RedisCacheService {
  private unavailableLogged = false;

  constructor(private readonly logger: LoggerService) {}

  isEnabled(): boolean {
    if (process.env.REDIS_ENABLED === 'false') return false;
    if (isRedisCircuitOpen()) return false;
    return true;
  }

  getClient() {
    if (!this.isEnabled()) throw new Error('Redis disabled');
    return getSharedRedisClient(0);
  }

  private markUnavailable(err?: unknown) {
    tripRedisCircuit();
    if (!this.unavailableLogged) {
      this.unavailableLogged = true;
      this.logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        'Redis unavailable — cache skipped',
      );
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) return null;
    try {
      const client = this.getClient();
      if (client.status !== 'ready') return null;
      const val = await client.get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch (err) {
      this.markUnavailable(err);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      const client = this.getClient();
      if (client.status !== 'ready') return;
      await client.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
      this.markUnavailable(err);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length || !this.isEnabled()) return;
    try {
      await this.getClient().del(...keys);
    } catch (err) {
      this.markUnavailable(err);
    }
  }

  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl = DEFAULT_TTL,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  async delPattern(pattern: string): Promise<number> {
    if (!this.isEnabled()) return 0;
    try {
      const redis = this.getClient();
      let cursor = '0';
      let deleted = 0;
      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length) {
          await redis.del(...keys);
          deleted += keys.length;
        }
      } while (cursor !== '0');
      return deleted;
    } catch (err) {
      this.markUnavailable(err);
      return 0;
    }
  }

  async ping(): Promise<boolean> {
    if (!this.isEnabled()) return false;
    try {
      await this.getClient().ping();
      return true;
    } catch {
      return false;
    }
  }

  readonly keys = {
    user: (id: string) => `user:${id}`,
    listing: (id: string) => `listing:${id}`,
    listings: (page: number, filters: string) => `listings:${page}:${filters}`,
    post: (id: string) => `post:${id}`,
    posts: (page: number) => `posts:${page}`,
    butcher: (id: string) => `butcher:${id}`,
    butchers: (country: string, page: number) => `butchers:${country}:${page}`,
    userFeed: (userId: string, page: number) => `feed:${userId}:${page}`,
    liveStreams: () => 'streams:live',
  };
}
