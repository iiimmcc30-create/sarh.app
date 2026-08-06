import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingsRepository } from './repositories/listings.repository';
import { ListingBoostController } from './boost/listing-boost.controller';
import { ListingBoostService } from './boost/listing-boost.service';
import { ListingPromotionController } from './promotion/listing-promotion.controller';
import { ListingPromotionService } from './promotion/listing-promotion.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ListingsController, ListingBoostController, ListingPromotionController],
  providers: [
    ListingsService,
    ListingsRepository,
    ListingBoostService,
    ListingPromotionService,
  ],
  exports: [ListingBoostService, ListingPromotionService],
})
export class ListingsModule {}
