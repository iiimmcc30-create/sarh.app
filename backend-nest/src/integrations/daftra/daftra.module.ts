import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueueModule } from '../../queue/queue.module';
import { CommonModule } from '../../common/common.module';
import { DaftraService } from './daftra.service';
import { AdminDaftraController } from './admin-daftra.controller';

@Module({
  imports: [PrismaModule, QueueModule, CommonModule],
  controllers: [AdminDaftraController],
  providers: [DaftraService],
  exports: [DaftraService],
})
export class DaftraModule {}
