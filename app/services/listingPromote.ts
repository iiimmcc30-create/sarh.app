import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';

export type PromotionGoal = 'visibility' | 'pinned' | 'featured';

export const PROMOTE_AMOUNT_MIN = 10;
export const PROMOTE_AMOUNT_MAX = 500;
export const PROMOTE_AMOUNT_DEFAULT = 20;

export const PROMOTE_DURATION_HOURS_MIN = 1;
export const PROMOTE_DURATION_HOURS_MAX = 168;
export const PROMOTE_DURATION_HOURS_DEFAULT = 6;

/**
 * Default base rate for visibility promotion per 24h.
 * Mirrors AppSettings default `pricing.promotion.per24h`.
 */
export const PROMOTION_BASE_PER_24H = 10;

/**
 * Boost price formula: ceil(hours / 12) × rate_per_12h
 * PIN:     rate = 6 SAR / 12h
 * FEATURE: rate = 5 SAR / 12h
 *
 * Examples (PIN):
 *   1h  → ceil(1/12)×6  = 1×6 = 6
 *  12h  → ceil(12/12)×6 = 1×6 = 6
 *  13h  → ceil(13/12)×6 = 2×6 = 12
 *  24h  → ceil(24/12)×6 = 2×6 = 12
 *  25h  → ceil(25/12)×6 = 3×6 = 18
 *  48h  → ceil(48/12)×6 = 4×6 = 24
 */
const BOOST_RATE_PER_12H: Record<'pinned' | 'featured', number> = {
  pinned: 6,
  featured: 5,
};

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

export type ReachEstimate = { min: number; max: number };

export type PromoteQuote = {
  goal: PromotionGoal;
  durationHours: number;
  amount: number;
  minimumAmount: number;
  currency: 'SAR';
  reachEstimate?: ReachEstimate;
  pricingMode: 'duration_based';
};

export type PromoteCheckoutPayload = {
  promotionGoal: PromotionGoal;
  promotionAmount: number;
  promotionDurationHours: number;
  totalAmount: number;
  adId: string;
  startTime: string;
  endTime: string;
  reachEstimate?: ReachEstimate;
};

/**
 * Client-side boost price (mirrors server formula exactly).
 * Server is always authoritative; this is for live UI preview only.
 */
export function computeBoostPrice(goal: 'pinned' | 'featured', durationHours: number): number {
  const hours = Math.max(1, Math.round(durationHours));
  const rate = BOOST_RATE_PER_12H[goal];
  return Math.ceil(hours / 12) * rate;
}

/**
 * Client-side visibility promotion price (minimum based on duration).
 * Formula: ceil(hours / 24) × basePer24h
 * 
 * Examples (base=10):
 *  1h  → 10, 24h → 10, 25h → 20, 48h → 20, 49h → 30, 72h → 30
 */
export function computeVisibilityMinPrice(durationHours: number, basePer24h = PROMOTION_BASE_PER_24H): number {
  const hours = Math.max(1, Math.round(durationHours));
  return Math.ceil(hours / 24) * basePer24h;
}

/** Estimated reach range for visibility promotion. */
export function estimatePromotionReach(amount: number, durationHours: number): ReachEstimate {
  const budget = Math.min(PROMOTE_AMOUNT_MAX, Math.max(PROMOTE_AMOUNT_MIN, Math.round(amount)));
  const hours = clampPromoteDurationHours(durationHours);
  const min = Math.max(50, Math.round(budget * 9 + hours * 3));
  const max = Math.max(min + 30, Math.round(budget * 15 + hours * 5));
  return { min, max };
}

export function resolvePromoteAmount(
  goal: PromotionGoal,
  durationHours: number,
  userBudget: number,
): number {
  if (goal === 'visibility') {
    const minPrice = computeVisibilityMinPrice(durationHours);
    return Math.max(minPrice, Math.min(PROMOTE_AMOUNT_MAX, Math.round(userBudget)));
  }
  return computeBoostPrice(goal as 'pinned' | 'featured', durationHours);
}

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
  const hours = clampPromoteDurationHours(promotionDurationHours);
  const amount = resolvePromoteAmount(promotionGoal, hours, promotionAmount);
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
  const reachEstimate =
    promotionGoal === 'visibility' ? estimatePromotionReach(amount, hours) : undefined;
  return {
    promotionGoal,
    promotionAmount: amount,
    promotionDurationHours: hours,
    totalAmount: amount,
    adId,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    reachEstimate,
  };
}

export function validatePromoteForm(
  goal: PromotionGoal | null,
  amount: number,
  durationHours: number,
): string | null {
  if (!goal) return 'اختر هدف الترويج';
  if (durationHours < PROMOTE_DURATION_HOURS_MIN || durationHours > PROMOTE_DURATION_HOURS_MAX) {
    return `المدة يجب أن تكون بين ${PROMOTE_DURATION_HOURS_MIN} و ${PROMOTE_DURATION_HOURS_MAX} ساعة`;
  }
  if (goal === 'visibility') {
    const minRequired = computeVisibilityMinPrice(durationHours);
    if (amount < minRequired) {
      return `الحد الأدنى للميزانية لهذه المدة: ${minRequired} ريال`;
    }
    if (amount > PROMOTE_AMOUNT_MAX) {
      return `الميزانية يجب أن تكون أقل من ${PROMOTE_AMOUNT_MAX} ريال`;
    }
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

export async function fetchPromoteQuote(
  goal: PromotionGoal,
  durationHours: number,
  amount?: number,
): Promise<PromoteQuote> {
  const params = new URLSearchParams({
    goal,
    durationHours: String(durationHours),
  });
  if (goal === 'visibility' && amount != null) {
    params.set('amount', String(amount));
  }
  const res = await fetch(`${API_BASE}/api/listings/promote/quote?${params.toString()}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.messageAr ?? json.message ?? 'تعذّر حساب السعر');
  }
  return json.data as PromoteQuote;
}

export async function initiatePromotePayment(
  accessToken: string,
  payload: PromoteCheckoutPayload,
  method = 'mada',
): Promise<InitiatePromotePaymentResult> {
  const isBoost = payload.promotionGoal === 'pinned' || payload.promotionGoal === 'featured';

  const body: Record<string, unknown> = {
    method,
    durationHours: payload.promotionDurationHours,
    promotionGoal: payload.promotionGoal,
  };

  if (payload.promotionGoal === 'visibility') {
    body.amount = payload.promotionAmount;
  }

  const endpoint = isBoost
    ? `${API_BASE}/api/listings/${payload.adId}/boost`
    : `${API_BASE}/api/listings/${payload.adId}/promotion`;

  const boostBody = isBoost
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

export function formatReachEstimate(reach: ReachEstimate): string {
  return `${reach.min.toLocaleString('ar-SA')}–${reach.max.toLocaleString('ar-SA')} مشاهدة`;
}
