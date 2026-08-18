import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  closeSharedRedisClients,
  duplicateSharedRedisClient,
  getSharedRedisClient,
  type SharedRedisKind,
} from './redis-connection';

@Injectable()
export class SharedRedisService implements OnModuleDestroy {
  isEnabled(): boolean {
    return process.env.REDIS_ENABLED !== 'false';
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
