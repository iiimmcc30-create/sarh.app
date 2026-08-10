/**
 * Boost plans used for the ListingBoostSheet day-chip UI.
 * Amounts are computed from the slab formula: ceil(days×24 / 12) × rate_per_12h
 * PIN rate=6, FEATURE rate=5, BOTH rate=11
 */
export const BOOST_PLANS = {
  pinned: [
    { durationDays: 1, durationHours: 24, amount: 12, labelAr: 'يوم واحد' },
    { durationDays: 3, durationHours: 72, amount: 36, labelAr: '٣ أيام' },
    { durationDays: 7, durationHours: 168, amount: 84, labelAr: '٧ أيام' },
  ],
  featured: [
    { durationDays: 1, durationHours: 24, amount: 10, labelAr: 'يوم واحد' },
    { durationDays: 3, durationHours: 72, amount: 30, labelAr: '٣ أيام' },
    { durationDays: 7, durationHours: 168, amount: 70, labelAr: '٧ أيام' },
  ],
  both: [
    { durationDays: 1, durationHours: 24, amount: 22, labelAr: 'يوم واحد' },
    { durationDays: 3, durationHours: 72, amount: 66, labelAr: '٣ أيام' },
    { durationDays: 7, durationHours: 168, amount: 154, labelAr: '٧ أيام' },
  ],
} as const;

export type BoostPlanType = keyof typeof BOOST_PLANS;
