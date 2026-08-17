import { redisConnection } from './redis-connection';

describe('redisConnection', () => {
  const keys = [
    'REDIS_URL',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
  ] as const;
  let snapshot: Record<string, string | undefined>;

  beforeEach(() => {
    snapshot = {};
    for (const key of keys) snapshot[key] = process.env[key];
    for (const key of keys) delete process.env[key];
  });

  afterEach(() => {
    for (const key of keys) {
      if (snapshot[key] === undefined) delete process.env[key];
      else process.env[key] = snapshot[key];
    }
  });

  it('prefers REDIS_URL over host/port/password', () => {
    process.env.REDIS_URL = 'redis://:s3cret@red-internal:6379';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '1111';
    process.env.REDIS_PASSWORD = 'ignored';

    expect(redisConnection(1)).toMatchObject({
      host: 'red-internal',
      port: 6379,
      password: 's3cret',
      db: 1,
    });
  });

  it('falls back to REDIS_HOST when REDIS_URL is absent', () => {
    process.env.REDIS_HOST = 'cache';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_PASSWORD = 'local';

    expect(redisConnection(2)).toMatchObject({
      host: 'cache',
      port: 6380,
      password: 'local',
      db: 2,
    });
  });
});
