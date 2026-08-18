import '../load-env';
import { NestFactory } from '@nestjs/core';
import { LoggerService } from '../common/services/logger.service';
import { initialiseSentry } from '../shared/lib/sentry';
import { WorkerModule } from './queue.module';
import { WorkerCronService } from './services/worker-cron.service';
import { FeeCheckQueueService } from './services/fee-check-queue.service';
import { RedisCacheService } from '../redis/services/redis-cache.service';

async function bootstrap() {
  initialiseSentry();
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log'],
  });
  app.enableShutdownHooks();
  app.get(WorkerCronService);
  const logger = app.get(LoggerService);
  logger.info({}, 'Worker application context started');

  try {
    const cache = app.get(RedisCacheService);
    const client = cache.getClient();
    if (client.status === 'wait') {
      await client.connect();
    }
    const stats = await cache.serverStats();
    if (stats) {
      logger.info(stats, 'Redis server clients');
    }
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      'Redis INFO clients unavailable',
    );
  }

  try {
    const fees = app.get(FeeCheckQueueService);
    const job = await fees.addProbeJob();
    logger.info({ jobId: job?.id ?? null }, 'BullMQ probe job enqueued');
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      'BullMQ probe enqueue failed',
    );
  }
}

bootstrap().catch((err) => {
  console.error('Worker bootstrap failed', err);
  process.exit(1);
});
