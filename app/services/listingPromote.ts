import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';

export type PromotionGoal = 'visibility' | 'pinned' | 'featured';

export const PROMOTE_AMOUNT_MIN = 10;
export const PROMOTE_AMOUNT_MAX = 500;
export const PROMOTE_AMOUNT_DEFAULT = 20;

export const PROMOTE_DURATION_HOURS_MIN = 1;
export const PROMOTE_DURATION_HOURS_MAX = 168;
export const PROMOTE_DURATION_HOURS_DEFAULT = 6;

/** Mirrors backend BOOST_PLANS for client-side price preview. */
const BOOST_PLAN_POINTS = {
  pinned: [
    { hours: 24, amount: 12 },
    { hours: 72, amount: 29 },
    { hours: 168, amount: 59 },
  ],
  featured: [
    { hours: 24, amount: 10 },
    { hours: 72, amount: 25 },
    { hours: 168, amount: 49 },
  ],
} as const;

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
  currency: 'SAR';
  reachEstimate?: ReachEstimate;
  pricingMode: 'user_budget' | 'duration_based';
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

function interpolateBoostPrice(
  points: readonly { hours: number; amount: number }[],
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

/** Client-side boost price preview (server is authoritative at checkout). */
export function computeBoostPrice(goal: 'pinned' | 'featured', durationHours: number): number {
  const hours = clampPromoteDurationHours(durationHours);
  const points = BOOST_PLAN_POINTS[goal];
  return interpolateBoostPrice(points, hours);
}

/** Estimated reach range for visibility promotion. */
export function estimatePromotionReach(amount: number, durationHours: number): ReachEstimate {
  const budget = clampPromoteAmount(amount);
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
  if (goal === 'visibility') return clampPromoteAmount(userBudget);
  return computeBoostPrice(goal, durationHours);
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
    promotionGoal === 'visibility'
      ? estimatePromotionReach(amount, hours)
      : undefined;
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
  if (goal === 'visibility') {
    if (amount < PROMOTE_AMOUNT_MIN || amount > PROMOTE_AMOUNT_MAX) {
      return `الميزانية يجب أن تكون بين ${PROMOTE_AMOUNT_MIN} و ${PROMOTE_AMOUNT_MAX} ريال`;
    }
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
