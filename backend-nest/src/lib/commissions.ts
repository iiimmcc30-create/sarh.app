// Commission calculation — store exemption driven by plan permissions (storeCommission = 0)
import type { PlanPermissions } from '../plans/plan.types';
import { permissionNumber } from '../plans/plan.types';

export type ListingCat =
  | 'camels'
  | 'sheep'
  | 'goats'
  | 'cows'
  | 'horses'
  | 'birds'
  | 'feed'
  | 'equipment'
  | 'store';

/**
 * Effective butcher/store listing fee rate (percent of sale price).
 * Plan permission `storeCommission` is an exemption flag: <= 0 = exempt; > 0 = charged at this rate.
 * Do not expose this constant on butcher-facing or public fee rule copy.
 */
export const BUTCHER_STORE_COMMISSION_PERCENT = 10;

/** @deprecated Use isStoreExemptFromPermissions */
export function isStoreExempt(planId: string): boolean {
  void planId;
  return false;
}

export function isStoreExemptFromPermissions(
  permissions?: PlanPermissions,
): boolean {
  if (!permissions) return false;
  return (
    permissionNumber(
      permissions,
      'storeCommission',
      BUTCHER_STORE_COMMISSION_PERCENT,
    ) <= 0
  );
}

export interface CommissionResult {
  commission: number;
  isExempt: boolean;
  dueDate: Date;
  ruleDescription: string;
}

export function calculateCommission(
  category: ListingCat,
  price: number,
  _quantity = 1,
  permissions?: PlanPermissions,
  audience: 'USER' | 'BUTCHER' = 'USER',
): CommissionResult {
  const noFee = {
    commission: 0,
    isExempt: true,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ruleDescription: 'لا رسوم',
  };

  // Commission applies only to non-subscribed butchers (store sales / listing fees).
  // There is no separate order_total × rate path in this codebase.
  if (audience !== 'BUTCHER' || category !== 'store') {
    return {
      ...noFee,
      ruleDescription: 'لا رسوم على إعلانات المواشي والمعدات',
    };
  }

  const isExempt = isStoreExemptFromPermissions(permissions);

  let commission = 0;
  let ruleDescription = '';

  if (isExempt) {
    ruleDescription = 'صفر عمولة — ملحمة باشتراك مدفوع';
  } else {
    const rate = BUTCHER_STORE_COMMISSION_PERCENT;
    commission = Math.ceil((price * rate) / 100);
    // Internal description — avoid leaking the rate into butcher-facing fee rule tables.
    ruleDescription = `عمولة المنصة على مبيعات المتجر`;
  }

  return {
    commission,
    isExempt,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ruleDescription,
  };
}

export function shouldCreateFee(
  category: ListingCat,
  permissions?: PlanPermissions,
  audience: 'USER' | 'BUTCHER' = 'USER',
): boolean {
  if (audience !== 'BUTCHER') return false;
  if (category !== 'store') return false;
  if (isStoreExemptFromPermissions(permissions)) return false;
  return true;
}

/** Public fee rules — butcher/store rows must not reveal the numeric rate. */
export const COMMISSION_TABLE = [
  {
    icon: '🏪',
    nameAr: 'ملحمة (بدون اشتراك)',
    nameEn: 'Butcher (no subscription)',
    ruleAr: 'عمولة المنصة حسب الباقة',
    ruleEn: 'Platform fee per plan',
    color: '#A855F7',
  },
  {
    icon: '✅',
    nameAr: 'ملحمة (باشتراك)',
    nameEn: 'Butcher (subscribed)',
    ruleAr: 'صفر عمولة',
    ruleEn: 'Zero commission',
    color: '#10B981',
  },
];
