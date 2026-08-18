import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  closeSharedRedisClients,
  duplicateSharedRedisClient,
  getSharedRedisClient,
  tripRedisCircuit,
  type SharedRedisKind,
} from './redis-connection';

@Injectable()
export class SharedRedisService implements OnModuleInit, OnModuleDestroy {
  isEnabled(): boolean {
    return process.env.REDIS_ENABLED !== 'false';
  }

  onModuleInit() {
    if (!this.isEnabled()) return;
    for (const db of [0, 2]) {
      const client = getSharedRedisClient(db);
      if (client.status === 'wait') {
        client.connect().catch(() => tripRedisCircuit());
      }
    }
  }

  getClient(db: number, kind: SharedRedisKind = 'default') {
    return getSharedRedisClient(db, kind);
  }

  duplicate(db: number, kind: SharedRedisKind = 'default') {
    return duplicateSharedRedisClient(db, kind);
  }

  async onModuleDestroy() {
    await closeSharedRedisClients();
  }
}
