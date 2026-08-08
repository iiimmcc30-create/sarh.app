export const BOOST_PLANS = {
  pinned: [
    { durationDays: 1, amount: 12, labelAr: 'يوم واحد' },
    { durationDays: 3, amount: 29, labelAr: '٣ أيام' },
    { durationDays: 7, amount: 59, labelAr: '٧ أيام' },
  ],
  featured: [
    { durationDays: 1, amount: 10, labelAr: 'يوم واحد' },
    { durationDays: 3, amount: 25, labelAr: '٣ أيام' },
    { durationDays: 7, amount: 49, labelAr: '٧ أيام' },
  ],
  both: [
    { durationDays: 1, amount: 20, labelAr: 'يوم واحد' },
    { durationDays: 3, amount: 45, labelAr: '٣ أيام' },
    { durationDays: 7, amount: 95, labelAr: '٧ أيام' },
  ],
} as const;

export type BoostPlanType = keyof typeof BOOST_PLANS;
