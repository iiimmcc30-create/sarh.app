import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsEnum, IsIn, IsString } from 'class-validator';
import { RateLimit } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { successResponse } from '../../common/utils/response.util';
import type { JwtPayload } from '../../common/types/jwt-payload.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ListingPromotionService } from './listing-promotion.service';
import type { PromotionTierKey } from './promotion-tiers.config';

class InitiatePromotionDto {
  @IsIn([1, 3, 7])
  durationDays: number;

  @IsString()
  method: string;

  @IsEnum(['standard'])
  tier: PromotionTierKey = 'standard';
}

class TrackPromotionEventDto {
  @IsEnum(['impression', 'click', 'view'])
  event: 'impression' | 'click' | 'view';
}

@Controller('listings')
export class ListingPromotionController {
  constructor(private readonly promotions: ListingPromotionService) {}

  @RateLimit('api')
  @Get('promotion/plans')
  getPlans() {
    return successResponse(this.promotions.getPromotionPlans());
  }

  @UseGuards(JwtAuthGuard)
  @RateLimit('api')
  @Post(':listingId/promotion')
  @HttpCode(HttpStatus.CREATED)
  async initiate(
    @Param('listingId') listingId: string,
    @Body() dto: InitiatePromotionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return successResponse(
      await this.promotions.initiatePromotion(
        user,
        listingId,
        dto.durationDays,
        dto.method,
        dto.tier ?? 'standard',
      ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @RateLimit('api')
  @Get(':listingId/promotion/stats')
  async stats(@Param('listingId') listingId: string, @CurrentUser() user: JwtPayload) {
    return successResponse(await this.promotions.getPromotionStats(user, listingId));
  }

  @RateLimit('api')
  @Post(':listingId/promotion/track')
  @HttpCode(HttpStatus.OK)
  async track(@Param('listingId') listingId: string, @Body() dto: TrackPromotionEventDto) {
    return successResponse(await this.promotions.trackPromotionEvent(listingId, dto.event));
  }

  @UseGuards(JwtAuthGuard)
  @RateLimit('api')
  @Post('promotion/:promotionId/dev-complete')
  @HttpCode(HttpStatus.OK)
  async devComplete(@Param('promotionId') promotionId: string, @CurrentUser() user: JwtPayload) {
    return successResponse(await this.promotions.devCompletePromotion(user, promotionId));
  }
}
