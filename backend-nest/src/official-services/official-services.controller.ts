import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public, RateLimit } from '../common/decorators/auth.decorators';
import { successResponse } from '../common/utils/response.util';
import { OfficialServicesService } from './official-services.service';

@Controller('services')
export class OfficialServicesController {
  constructor(private readonly services: OfficialServicesService) {}

  @Public()
  @RateLimit('api')
  @Get()
  @HttpCode(HttpStatus.OK)
  async list() {
    const services = await this.services.listActive();
    return successResponse({ services });
  }
}
