import { clampPromoteAmount, clampPromoteDurationHours } from './promotion-limits.config';

export type ReachEstimate = { min: number; max: number };

/** Estimated impression range for visibility promotion (budget + duration). */
export function estimatePromotionReach(
  rawAmount: number,
  rawDurationHours: number,
): ReachEstimate {
  const amount = clampPromoteAmount(rawAmount);
  const durationHours = clampPromoteDurationHours(rawDurationHours);
  const min = Math.max(50, Math.round(amount * 9 + durationHours * 3));
  const max = Math.max(min + 30, Math.round(amount * 15 + durationHours * 5));
  return { min, max };
}
