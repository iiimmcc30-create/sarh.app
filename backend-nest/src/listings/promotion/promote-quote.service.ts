import { Injectable } from '@nestjs/common';
import { throwApi } from '../../common/exceptions/api.exception';
import { boostPriceForHours } from '../boost/boost-pricing.util';
import type { BoostPlanType } from '../boost/boost-plans.config';
import {
  clampPromoteAmount,
  clampPromoteDurationHours,
} from './promotion-limits.config';
import { estimatePromotionReach } from './reach-estimate.util';

export type PromoteGoal = 'visibility' | 'pinned' | 'featured';

export type PromoteQuoteInput = {
  goal: PromoteGoal;
  durationHours: number;
  amount?: number;
};

export type PromoteQuoteResult = {
  goal: PromoteGoal;
  durationHours: number;
  amount: number;
  currency: 'SAR';
  reachEstimate?: { min: number; max: number };
  pricingMode: 'user_budget' | 'duration_based';
};

@Injectable()
export class PromoteQuoteService {
  quote(input: PromoteQuoteInput): PromoteQuoteResult {
    const goal = input.goal;
    const durationHours = clampPromoteDurationHours(input.durationHours);

    if (goal === 'visibility') {
      if (input.amount == null) {
        throwApi(400, 'amount_required', 'الميزانية مطلوبة لترويج الظهور');
      }
      const amount = clampPromoteAmount(input.amount);
      const reachEstimate = estimatePromotionReach(amount, durationHours);
      return {
        goal,
        durationHours,
        amount,
        currency: 'SAR',
        reachEstimate,
        pricingMode: 'user_budget',
      };
    }

    if (goal === 'pinned' || goal === 'featured') {
      const amount = boostPriceForHours(goal as BoostPlanType, durationHours);
      return {
        goal,
        durationHours,
        amount,
        currency: 'SAR',
        pricingMode: 'duration_based',
      };
    }

    throwApi(400, 'invalid_goal', 'هدف الترويج غير صالح');
  }
}
