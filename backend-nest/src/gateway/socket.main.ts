import '../load-env';
import { NestFactory } from '@nestjs/core';
import { LoggerService } from '../common/services/logger.service';
import { initialiseSentry } from '../shared/lib/sentry';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  initialiseSentry();
  const app = await NestFactory.create(GatewayModule, { logger: false });
  const port = parseInt(process.env.PORT || '3002', 10);
  await app.listen(port, '0.0.0.0');

  const logger = app.get(LoggerService);
  logger.info({ port }, 'Socket.IO server running');
}

bootstrap().catch((err) => {
  console.error('Socket server failed', err);
  process.exit(1);
});
