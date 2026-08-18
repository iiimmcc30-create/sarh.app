import { redisConnection } from '../redis/redis-connection';

export const isRedisEnabled = () => process.env.REDIS_ENABLED !== 'false';

/** BullMQ connection options (DB 1). Uses options object to avoid ioredis version mismatch with BullMQ bundle. */
export const QUEUE_CONNECTION = redisConnection(1, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  EMAILS: 'emails',
  PUSH: 'push-notifications',
  FEE_CHECKS: 'fee-checks',
  IMAGE_PROCESSING: 'image-processing',
  SUBSCRIPTIONS: 'subscriptions',
} as const;
