import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';

export type PromotionGoal = 'visibility' | 'pinned' | 'featured';

export const PROMOTE_AMOUNT_MIN = 10;
export const PROMOTE_AMOUNT_MAX = 500;
export const PROMOTE_AMOUNT_DEFAULT = 20;

export const PROMOTE_DURATION_HOURS_MIN = 1;
export const PROMOTE_DURATION_HOURS_MAX = 168;
export const PROMOTE_DURATION_HOURS_DEFAULT = 6;

export type PromoteGoalOption = {
  key: PromotionGoal;
  icon: string;
  title: string;
  desc: string;
  accent: 'electric' | 'gold' | 'promotion';
};

export const PROMOTE_GOAL_OPTIONS: PromoteGoalOption[] = [
  {
    key: 'visibility',
    icon: 'rocket-outline',
    title: 'زيادة ظهور إعلانك',
    desc: 'زيادة قوة الظهور في الخوارزمية — بدون أي تغيير على شكل الإعلان',
    accent: 'promotion',
  },
  {
    key: 'pinned',
    icon: 'pin',
    title: 'تثبيت إعلانك في أعلى القائمة',
    desc: 'دبوس صغير بجانب العنوان — يبقى الإعلان في أعلى القائمة',
    accent: 'electric',
  },
  {
    key: 'featured',
    icon: 'star',
    title: 'شارة مميزة في نتائج البحث',
    desc: 'نجمة ذهبية صغيرة بجانب عنوان الإعلان في نتائج البحث',
    accent: 'gold',
  },
];

export type PromoteCheckoutPayload = {
  promotionGoal: PromotionGoal;
  promotionAmount: number;
  promotionDurationHours: number;
  totalAmount: number;
  adId: string;
  startTime: string;
  endTime: string;
};

export function clampPromoteAmount(value: number): number {
  return Math.min(PROMOTE_AMOUNT_MAX, Math.max(PROMOTE_AMOUNT_MIN, Math.round(value)));
}

export function clampPromoteDurationHours(value: number): number {
  return Math.min(
    PROMOTE_DURATION_HOURS_MAX,
    Math.max(PROMOTE_DURATION_HOURS_MIN, Math.round(value)),
  );
}

export function parsePromoteAmountInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return clampPromoteAmount(n);
}

export function parsePromoteDurationInput(raw: string): number | null {
  const cleaned = raw.replace(/[^\d]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return clampPromoteDurationHours(n);
}

export function buildPromoteCheckoutPayload(
  adId: string,
  promotionGoal: PromotionGoal,
  promotionAmount: number,
  promotionDurationHours: number,
): PromoteCheckoutPayload {
  const amount = clampPromoteAmount(promotionAmount);
  const hours = clampPromoteDurationHours(promotionDurationHours);
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
  return {
    promotionGoal,
    promotionAmount: amount,
    promotionDurationHours: hours,
    totalAmount: amount,
    adId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
  };
}

export function validatePromoteForm(
  goal: PromotionGoal | null,
  amount: number,
  durationHours: number,
): string | null {
  if (!goal) return 'اختر هدف الترويج';
  if (amount < PROMOTE_AMOUNT_MIN || amount > PROMOTE_AMOUNT_MAX) {
    return `المبلغ يجب أن يكون بين ${PROMOTE_AMOUNT_MIN} و ${PROMOTE_AMOUNT_MAX} ريال`;
  }
  if (durationHours < PROMOTE_DURATION_HOURS_MIN || durationHours > PROMOTE_DURATION_HOURS_MAX) {
    return `المدة يجب أن تكون بين ${PROMOTE_DURATION_HOURS_MIN} و ${PROMOTE_DURATION_HOURS_MAX} ساعة`;
  }
  return null;
}

export function goalFromBoostType(type?: string | null): PromotionGoal | null {
  if (type === 'promotion' || type === 'visibility') return 'visibility';
  if (type === 'pinned' || type === 'featured') return type;
  return null;
}

export type InitiatePromotePaymentResult = {
  paymentId: string;
  checkoutUrl?: string;
  devMode?: boolean;
  amount: number;
  promotionId?: string;
  boostId?: string;
};

export async function initiatePromotePayment(
  accessToken: string,
  payload: PromoteCheckoutPayload,
  method = 'mada',
): Promise<InitiatePromotePaymentResult> {
  const body = {
    method,
    amount: payload.promotionAmount,
    durationHours: payload.promotionDurationHours,
    promotionGoal: payload.promotionGoal,
  };

  const endpoint =
    payload.promotionGoal === 'visibility'
      ? `${API_BASE}/api/listings/${payload.adId}/promotion`
      : `${API_BASE}/api/listings/${payload.adId}/boost`;

  const boostBody =
    payload.promotionGoal === 'pinned' || payload.promotionGoal === 'featured'
      ? { ...body, boostType: payload.promotionGoal }
      : body;

  const res = await authFetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(boostBody),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.messageAr ?? json.message ?? 'تعذّر بدء عملية الدفع');
  }

  const data = json.data ?? {};
  return {
    paymentId: data.paymentId,
    checkoutUrl: data.checkoutUrl,
    devMode: data.devMode,
    amount: data.amount ?? payload.totalAmount,
    promotionId: data.promotionId,
    boostId: data.boostId,
  };
}

export function formatPromoteHours(hours: number): string {
  return `${hours.toLocaleString('ar-SA')} ساعة`;
}

export function formatPromoteAmount(amount: number): string {
  return `${amount.toLocaleString('ar-SA')} ريال`;
}
