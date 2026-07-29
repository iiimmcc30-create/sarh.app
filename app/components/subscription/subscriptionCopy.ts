import type { PlanAudience } from '@/services/subscriptionPlans';

export type BillingCycle = 'monthly' | 'yearly';

export function subscriptionHeroCopy(audience: PlanAudience) {
  if (audience === 'BUTCHER') {
    return {
      title: 'باقات الملحمة',
      subtitle: 'خطط احترافية لإدارة متجرك واستقبال الطلبات',
      compareTitle: 'قارن مزايا الباقات',
      freeCta: 'متابعة بالباقة المجانية',
      upgradeSection: 'خطط الترقية للملحمة',
    };
  }
  return {
    title: 'خطط الاشتراك',
    subtitle: 'اختر الخطة المناسبة لنشاطك في سرح',
    compareTitle: 'قارن الخطط والمزايا',
    freeCta: 'متابعة بالخطة المجانية',
    upgradeSection: 'الخطط المتاحة',
  };
}

export function planCtaLabel(
  slug: string,
  isCurrent: boolean,
  isFree: boolean,
): string {
  if (isFree) return 'الخطة الحالية';
  if (isCurrent) return 'تجديد الاشتراك';
  return 'ترقية الآن';
}
