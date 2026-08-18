import { Injectable } from '@nestjs/common';
import { getSharedRedisClient } from '../redis-connection';

@Injectable()
export class RedisSessionService {
  private markedUnavailable = false;

  isEnabled(): boolean {
    if (process.env.REDIS_ENABLED === 'false') return false;
    if (this.markedUnavailable && process.env.NODE_ENV !== 'production')
      return false;
    return true;
  }

  getClient() {
    if (!this.isEnabled()) throw new Error('Redis disabled');
    return getSharedRedisClient(2);
  }

  async set(key: string, value: unknown, ttl: number): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await this.getClient().set(key, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') this.markedUnavailable = true;
      else throw err;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) return null;
    try {
      const val = await this.getClient().get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch {
      return null;
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length || !this.isEnabled()) return;
    try {
      await this.getClient().del(...keys);
    } catch {
      /* non-critical */
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
}
