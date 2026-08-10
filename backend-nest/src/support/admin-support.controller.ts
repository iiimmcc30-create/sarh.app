import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RateLimit, Roles } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { successResponse } from '../common/utils/response.util';
import type { JwtPayload } from '../common/types/jwt-payload.interface';
import { SupportTicketsService } from './services/support-tickets.service';
import { AccountVerificationService } from './services/account-verification.service';
import { FaqService } from './services/faq.service';

const STAFF = ['ADMIN', 'MODERATOR'] as const;

@Controller('admin/support')
export class AdminSupportController {
  constructor(
    private readonly tickets: SupportTicketsService,
    private readonly verification: AccountVerificationService,
    private readonly faq: FaqService,
  ) {}

  @Roles(...STAFF)
  @RateLimit('api')
  @Get('tickets')
  @HttpCode(HttpStatus.OK)
  listTickets(@Query() query: Record<string, unknown>) {
    return successResponse(this.tickets.listAdminTickets(query));
  }

  @Roles(...STAFF)
  @RateLimit('api')
  @Get('tickets/staff')
  @HttpCode(HttpStatus.OK)
  listStaff() {
    return successResponse(this.tickets.listAssignableStaff());
  }

  @Roles(...STAFF)
  @RateLimit('api')
  @Get('tickets/:id')
  @HttpCode(HttpStatus.OK)
  getTicket(@Param('id') id: string) {
    return successResponse(this.tickets.getAdminTicket(id));
  }

  @Roles(...STAFF)
  @RateLimit('api')
  @Patch('tickets/:id')
  @HttpCode(HttpStatus.OK)
  updateTicket(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return successResponse(this.tickets.updateAdminTicket(id, body));
  }

  @Roles(...STAFF)
  @RateLimit('api')
  @Post('tickets/:id/messages')
  @HttpCode(HttpStatus.OK)
  replyTicket(
    @CurrentUser() staff: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return successResponse(this.tickets.replyAsStaff(staff, id, body));
  }

  @Roles(...STAFF)
  @RateLimit('api')
  @Get('verification')
  @HttpCode(HttpStatus.OK)
  listVerification(@Query() query: Record<string, unknown>) {
    return successResponse(this.verification.listAdmin(query));
  }

  @Roles(...STAFF)
  @RateLimit('api')
  @Get('verification/:id')
  @HttpCode(HttpStatus.OK)
  getVerification(@Param('id') id: string) {
    return successResponse(this.verification.getAdmin(id));
  }

  @Roles(...STAFF)
  @RateLimit('api')
  @Patch('verification/:id')
  @HttpCode(HttpStatus.OK)
  updateVerification(
    @CurrentUser() staff: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return successResponse(this.verification.updateAdmin(staff, id, body));
  }

  @Roles(...STAFF)
  @RateLimit('api')
  @Get('faqs')
  @HttpCode(HttpStatus.OK)
  listFaqs(@Query() query: Record<string, unknown>) {
    return successResponse(this.faq.listAdmin(query));
  }

  @Roles(...STAFF)
  @RateLimit('api')
  @Post('faqs')
  @HttpCode(HttpStatus.CREATED)
  createFaq(@Body() body: Record<string, unknown>) {
    return successResponse(this.faq.create(body));
  }

  @Roles(...STAFF)
  @RateLimit('api')
  @Patch('faqs/:id')
  @HttpCode(HttpStatus.OK)
  updateFaq(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return successResponse(this.faq.update(id, body));
  }

  @Roles(...STAFF)
  @RateLimit('api')
  @Delete('faqs/:id')
  @HttpCode(HttpStatus.OK)
  deleteFaq(@Param('id') id: string) {
    return successResponse(this.faq.remove(id));
  }

  @Roles(...STAFF)
  @RateLimit('api')
  @Put('faqs/reorder')
  @HttpCode(HttpStatus.OK)
  reorderFaqs(@Body() body: Record<string, unknown>) {
    return successResponse(this.faq.reorder(body));
  }
}
