import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { throwApi } from '../../common/exceptions/api.exception';
import {
  boostPriceForHours,
  promotionPriceForHours,
  PROMOTION_DEFAULT_BASE_PER_24H,
  BOOST_RATE_PER_12H,
} from '../boost/boost-pricing.util';
import type { BoostPlanType } from '../boost/boost-pricing.util';
import { clampPromoteDurationHours } from './promotion-limits.config';
import { estimatePromotionReach, DEFAULT_REACH_FACTORS, type ReachFactors } from './reach-estimate.util';

export type PromoteGoal = 'visibility' | 'pinned' | 'featured';

export type PromoteQuoteInput = {
  goal: PromoteGoal;
  durationHours: number;
  /** Ignored for visibility (price is fully computed server-side). Kept for API compatibility. */
  amount?: number;
};

export type PromoteQuoteResult = {
  goal: PromoteGoal;
  durationHours: number;
  amount: number;
  minimumAmount: number;
  currency: 'SAR';
  reachEstimate?: { min: number; max: number };
  pricingMode: 'duration_based';
};

@Injectable()
export class PromoteQuoteService {
  constructor(private readonly prisma: PrismaService) {}

  private async getNumberSetting(key: string, fallback: number): Promise<number> {
    try {
      const s = await this.prisma.appSetting.findUnique({ where: { key } });
      if (s && typeof s.value === 'number' && s.value > 0) return s.value;
    } catch {
      /* fall through */
    }
    return fallback;
  }

  async getBoostRate(boostType: BoostPlanType): Promise<number> {
    if (boostType === 'both') {
      const pin = await this.getNumberSetting('pricing.boost.pin.per12h', BOOST_RATE_PER_12H.pinned);
      const ftr = await this.getNumberSetting('pricing.boost.feature.per12h', BOOST_RATE_PER_12H.featured);
      return pin + ftr;
    }
    const key = boostType === 'pinned' ? 'pricing.boost.pin.per12h' : 'pricing.boost.feature.per12h';
    return this.getNumberSetting(key, BOOST_RATE_PER_12H[boostType]);
  }

  async getPromotionBase(): Promise<number> {
    return this.getNumberSetting('pricing.promotion.per24h', PROMOTION_DEFAULT_BASE_PER_24H);
  }

  async getReachFactors(): Promise<ReachFactors> {
    const [budgetFactorMin, budgetFactorMax, hourFactorMin, hourFactorMax] = await Promise.all([
      this.getNumberSetting('pricing.reach.budgetFactorMin', DEFAULT_REACH_FACTORS.budgetFactorMin),
      this.getNumberSetting('pricing.reach.budgetFactorMax', DEFAULT_REACH_FACTORS.budgetFactorMax),
      this.getNumberSetting('pricing.reach.hourFactorMin', DEFAULT_REACH_FACTORS.hourFactorMin),
      this.getNumberSetting('pricing.reach.hourFactorMax', DEFAULT_REACH_FACTORS.hourFactorMax),
    ]);
    return { budgetFactorMin, budgetFactorMax, hourFactorMin, hourFactorMax };
  }

  async quote(input: PromoteQuoteInput): Promise<PromoteQuoteResult> {
    const goal = input.goal;
    const durationHours = clampPromoteDurationHours(input.durationHours);

    if (goal === 'visibility') {
      const base = await this.getPromotionBase();
      const amount = promotionPriceForHours(durationHours, base);
      const factors = await this.getReachFactors();
      const reachEstimate = estimatePromotionReach(amount, durationHours, factors);
      return {
        goal,
        durationHours,
        amount,
        minimumAmount: amount,
        currency: 'SAR',
        reachEstimate,
        pricingMode: 'duration_based',
      };
    }

    if (goal === 'pinned' || goal === 'featured') {
      const rate = await this.getBoostRate(goal as BoostPlanType);
      const amount = boostPriceForHours(goal as BoostPlanType, durationHours, rate);
      return {
        goal,
        durationHours,
        amount,
        minimumAmount: amount,
        currency: 'SAR',
        pricingMode: 'duration_based',
      };
    }

    throwApi(400, 'invalid_goal', 'هدف الترويج غير صالح');
  }
}
