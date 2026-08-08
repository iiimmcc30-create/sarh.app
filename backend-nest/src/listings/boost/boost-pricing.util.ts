import { BOOST_PLANS, type BoostPlanType } from './boost-plans.config';
import {
  PROMOTE_AMOUNT_MIN,
  clampPromoteDurationHours,
} from '../promotion/promotion-limits.config';

function planHourPoints(boostType: BoostPlanType) {
  return BOOST_PLANS[boostType].map((p) => ({
    hours: p.durationDays * 24,
    amount: p.amount,
  }));
}

function interpolateAmount(
  points: { hours: number; amount: number }[],
  hours: number,
): number {
  if (hours <= points[0].hours) {
    const rate = points[0].amount / points[0].hours;
    return Math.max(PROMOTE_AMOUNT_MIN, Math.round(rate * hours));
  }

  for (let i = 1; i < points.length; i++) {
    if (hours <= points[i].hours) {
      const prev = points[i - 1];
      const curr = points[i];
      const ratio = (hours - prev.hours) / (curr.hours - prev.hours);
      return Math.round(prev.amount + ratio * (curr.amount - prev.amount));
    }
  }

  const prev = points[points.length - 2];
  const curr = points[points.length - 1];
  const rate = (curr.amount - prev.amount) / (curr.hours - prev.hours);
  return Math.round(curr.amount + rate * (hours - curr.hours));
}

/** Server-side price for pinned / featured / both boosts from duration in hours. */
export function boostPriceForHours(
  boostType: BoostPlanType,
  rawHours: number,
): number {
  const hours = clampPromoteDurationHours(rawHours);
  return interpolateAmount(planHourPoints(boostType), hours);
}
