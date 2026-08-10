/**
 * Slab pricing: each started 12-hour block costs a fixed rate.
 * Formula: ceil(hours / 12) × rate_per_12h
 *
 * PIN:     6 SAR / 12h  → 1h=6, 12h=6, 13h=12, 24h=12, 25h=18, 36h=18 …
 * FEATURE: 5 SAR / 12h  → 1h=5, 12h=5, 13h=10, 24h=10, 25h=15, 36h=15 …
 * BOTH:   11 SAR / 12h  → sum of pin+feature rates
 */

export const BOOST_RATE_PER_12H = {
  pinned: 6,
  featured: 5,
  both: 11,
} as const;

export type BoostPlanType = keyof typeof BOOST_RATE_PER_12H;

/** Minimum charge (1 h × feature rate). */
export const BOOST_AMOUNT_MIN = 5;

/**
 * Compute boost price for a given boost type and duration (hours).
 * optionalRate overrides the built-in rate (used when reading from AppSettings).
 */
export function boostPriceForHours(
  boostType: BoostPlanType,
  rawHours: number,
  overrideRate?: number,
): number {
  const hours = Math.max(1, Math.round(rawHours));
  const rate = overrideRate ?? BOOST_RATE_PER_12H[boostType];
  return Math.ceil(hours / 12) * rate;
}

/**
 * Compute visibility-promotion price for a given duration (hours).
 * Formula: ceil(hours / 24) × base_per_24h
 * 1-24h=base, 25-48h=2×base, 49-72h=3×base …
 */
export function promotionPriceForHours(
  rawHours: number,
  basePer24h: number,
): number {
  const hours = Math.max(1, Math.round(rawHours));
  return Math.ceil(hours / 24) * basePer24h;
}

/** Default base rate for visibility promotion per 24h (matches AppSettings default). */
export const PROMOTION_DEFAULT_BASE_PER_24H = 10;
