import {
  readWorkerHeartbeat,
  WORKER_HEARTBEAT_KEY,
} from './worker-heartbeat.service';
import { RedisCacheService } from '../../redis/services/redis-cache.service';

describe('readWorkerHeartbeat', () => {
  it('returns true when heartbeat key is fresh', async () => {
    const client = {
      status: 'ready',
      get: jest
        .fn()
        .mockResolvedValue(JSON.stringify({ ts: Date.now(), pid: 1 })),
    };
    const cache = {
      isEnabled: () => true,
      getClient: () => client,
    } as unknown as RedisCacheService;

    await expect(readWorkerHeartbeat(cache)).resolves.toBe(true);
    expect(client.get).toHaveBeenCalledWith(WORKER_HEARTBEAT_KEY);
  });

  it('returns false when heartbeat key is missing', async () => {
    const client = {
      status: 'ready',
      get: jest.fn().mockResolvedValue(null),
    };
    const cache = {
      isEnabled: () => true,
      getClient: () => client,
    } as unknown as RedisCacheService;

    await expect(readWorkerHeartbeat(cache)).resolves.toBe(false);
  });

  it('returns false when redis is disabled', async () => {
    const cache = {
      isEnabled: () => false,
      getClient: jest.fn(),
    } as unknown as RedisCacheService;

    await expect(readWorkerHeartbeat(cache)).resolves.toBe(false);
  });
});
