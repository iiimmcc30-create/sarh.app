import { Controller, Get, HttpCode } from '@nestjs/common';
import { Public } from '../common/decorators/auth.decorators';

@Controller('health')
export class SocketHealthController {
  @Public()
  @Get()
  @HttpCode(200)
  ping() {
    return { status: 'ok', service: 'socket' };
  }
}
