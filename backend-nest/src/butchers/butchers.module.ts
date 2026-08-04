import { Module } from '@nestjs/common';
import { ButchersController } from './butchers.controller';
import { ButchersService } from './butchers.service';
import { ButchersRepository } from './repositories/butchers.repository';
import { OrderLifecycleService } from './services/order-lifecycle.service';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { ButcherRankingService } from './services/butcher-ranking.service';
import { GatewaySharedModule } from '../gateway/gateway-shared.module';

@Module({
  imports: [GatewaySharedModule],
  controllers: [ButchersController],
  providers: [
    ButchersService,
    ButchersRepository,
    OrderLifecycleService,
    OrderStateMachineService,
    ButcherRankingService,
  ],
  exports: [ButcherRankingService],
})
export class ButchersModule {}
