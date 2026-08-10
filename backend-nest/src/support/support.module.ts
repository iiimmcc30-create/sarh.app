import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { SupportController } from './support.controller';
import { AdminSupportController } from './admin-support.controller';
import { SupportRepository } from './repositories/support.repository';
import { SupportTicketsService } from './services/support-tickets.service';
import { AccountVerificationService } from './services/account-verification.service';
import { FaqService } from './services/faq.service';
import { SupportNotificationsService } from './services/support-notifications.service';
import { SupportSeedService } from './services/support-seed.service';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [SupportController, AdminSupportController],
  providers: [
    SupportRepository,
    SupportTicketsService,
    AccountVerificationService,
    FaqService,
    SupportNotificationsService,
    SupportSeedService,
  ],
  exports: [SupportTicketsService, AccountVerificationService, FaqService],
})
export class SupportModule {}
