import { readFileSync } from 'fs';
import { join } from 'path';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../redis/services/redis-cache.service';
import { RedisSessionService } from '../redis/services/redis-session.service';
import { NotificationQueueService } from '../queue/services/notification-queue.service';

function readAppVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      version?: string;
    };
    if (typeof pkg.version === 'string' && pkg.version.trim()) {
      return pkg.version.trim();
    }
  } catch {
    // fall through
  }
  return process.env.npm_package_version || '1.0.0';
}

@Injectable()
export class HealthRepository {
  constructor(private readonly prisma: PrismaService) {}

  pingDb() {
    return this.prisma.$queryRaw`SELECT 1`;
  }
}

@Injectable()
export class HealthService {
  constructor(
    private readonly repo: HealthRepository,
    private readonly cache: RedisCacheService,
    private readonly sessions: RedisSessionService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  async check() {
    const start = Date.now();
    const checks = {
      db: false,
      redis_cache: false,
      redis_session: false,
      queue: false,
    };

    const redisEnabled = this.cache.isEnabled();

    await Promise.allSettled([
      this.repo.pingDb().then(() => {
        checks.db = true;
      }),
      redisEnabled
        ? Promise.race([
            this.cache.ping().then((ok: boolean) => {
              if (ok) checks.redis_cache = true;
            }),
            new Promise((resolve) => setTimeout(resolve, 200)),
          ])
        : Promise.resolve(),
      redisEnabled
        ? Promise.race([
            this.sessions.ping().then((ok: boolean) => {
              if (ok) checks.redis_session = true;
            }),
            new Promise((resolve) => setTimeout(resolve, 200)),
          ])
        : Promise.resolve(),
      (async () => {
        if (this.notificationQueue.isEnabled()) {
          await Promise.race([
            this.notificationQueue.getJobCounts().then(() => {
              checks.queue = true;
            }),
            new Promise((resolve) => setTimeout(resolve, 200)),
          ]);
        }
      })(),
    ]);

    const healthy = checks.db;
    const duration = Date.now() - start;

    return {
      status: healthy ? 'ok' : 'degraded',
      checks,
      duration: `${duration}ms`,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      version: readAppVersion(),
      build:
        process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ||
        process.env.GIT_COMMIT ||
        'local',
      apiFeatures: {
        userBlock: true,
        postCommentDelete: true,
        listingCommentDelete: true,
      },
      httpStatus: healthy ? 200 : 503,
    };
  }
}
