import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RedisCacheService } from '../../redis/services/redis-cache.service';
import { LoggerService } from '../../common/services/logger.service';

/** Redis key written by the worker process; API health reads it. */
export const WORKER_HEARTBEAT_KEY = 'sarh:worker:heartbeat';
const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_TTL_SEC = 90;

@Injectable()
export class WorkerHeartbeatService implements OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly cache: RedisCacheService,
    private readonly logger: LoggerService,
  ) {
    void this.beat();
    this.timer = setInterval(() => void this.beat(), HEARTBEAT_INTERVAL_MS);
    this.logger.info({}, 'Worker heartbeat started');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async beat(): Promise<void> {
    if (!this.cache.isEnabled()) return;
    try {
      const client = this.cache.getClient();
      if (client.status !== 'ready') return;
      await client.set(
        WORKER_HEARTBEAT_KEY,
        JSON.stringify({ ts: Date.now(), pid: process.pid }),
        'EX',
        HEARTBEAT_TTL_SEC,
      );
    } catch (err) {
      this.logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        'Worker heartbeat write failed',
      );
    }
  }
}

/** Returns true when a worker heartbeat was seen within TTL window. */
export async function readWorkerHeartbeat(
  cache: RedisCacheService,
): Promise<boolean> {
  if (!cache.isEnabled()) return false;
  try {
    const client = cache.getClient();
    if (client.status !== 'ready') return false;
    const raw = await client.get(WORKER_HEARTBEAT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { ts?: number };
    return typeof parsed.ts === 'number' && Date.now() - parsed.ts < HEARTBEAT_TTL_SEC * 1000;
  } catch {
    return false;
  }
}
