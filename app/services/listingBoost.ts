import { API_BASE } from '@/services/api';

export type BoostTypeKey = 'pinned' | 'featured' | 'both';

export type BoostPlanOption = {
  durationDays: number;
  amount: number;
  labelAr: string;
};

export type BoostPlansMap = Record<BoostTypeKey, BoostPlanOption[]>;

export const BOOST_TYPE_ORDER: BoostTypeKey[] = ['pinned', 'featured', 'both'];

export const BOOST_TYPE_META: Record<
  BoostTypeKey,
  {
    icon: string;
    emoji: string;
    title: string;
    desc: string;
    accent: 'gold' | 'electric' | 'royal';
  }
> = {
  pinned: {
    icon: 'pin',
    emoji: '📌',
    title: 'تثبيت الإعلان',
    desc: 'يظهر في أعلى قائمة الإعلانات',
    accent: 'electric',
  },
  featured: {
    icon: 'star',
    emoji: '⭐',
    title: 'تمييز الإعلان',
    desc: 'شارة مميزة في نتائج البحث',
    accent: 'gold',
  },
  both: {
    icon: 'rocket-outline',
    emoji: '🚀',
    title: 'تثبيت + تمييز',
    desc: 'أقصى ظهور في السوق',
    accent: 'royal',
  },
};

export const FALLBACK_BOOST_PLANS: BoostPlansMap = {
  pinned: [
    { durationDays: 3, amount: 29, labelAr: '٣ أيام' },
    { durationDays: 7, amount: 59, labelAr: '٧ أيام' },
  ],
  featured: [
    { durationDays: 3, amount: 25, labelAr: '٣ أيام' },
    { durationDays: 7, amount: 49, labelAr: '٧ أيام' },
  ],
  both: [
    { durationDays: 3, amount: 45, labelAr: '٣ أيام' },
    { durationDays: 7, amount: 95, labelAr: '٧ أيام' },
  ],
};

function normalizePlans(raw: unknown): BoostPlansMap {
  const base = { ...FALLBACK_BOOST_PLANS };
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;
  for (const key of BOOST_TYPE_ORDER) {
    const rows = obj[key];
    if (!Array.isArray(rows)) continue;
    const mapped = rows
      .map((row) => {
        if (!row || typeof row !== 'object') return null;
        const r = row as Record<string, unknown>;
        const durationDays = Number(r.durationDays);
        const amount = Number(r.amount);
        const labelAr = typeof r.labelAr === 'string' ? r.labelAr : '';
        if (!durationDays || !amount) return null;
        return { durationDays, amount, labelAr };
      })
      .filter(Boolean) as BoostPlanOption[];
    if (mapped.length > 0) base[key] = mapped;
  }
  return base;
}

export async function fetchBoostPlans(): Promise<BoostPlansMap> {
  try {
    const res = await fetch(`${API_BASE}/api/listings/boost/plans`);
    if (!res.ok) return FALLBACK_BOOST_PLANS;
    const json = await res.json();
    if (!json.success || !json.data) return FALLBACK_BOOST_PLANS;
    return normalizePlans(json.data);
  } catch {
    return FALLBACK_BOOST_PLANS;
  }
}

export function boostTypeLabel(type: BoostTypeKey): string {
  return BOOST_TYPE_META[type]?.title ?? type;
}

export function formatBoostExpiry(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function boostSuccessMessage(
  boostType: string,
  expiresAt?: string,
): string {
  const expiry = expiresAt ? formatBoostExpiry(expiresAt) : '';
  if (boostType === 'both') {
    return expiry
      ? `تم تثبيت وتمييز إعلانك بنجاح حتى ${expiry}.`
      : 'تم تثبيت وتمييز إعلانك بنجاح.';
  }
  if (boostType === 'featured') {
    return expiry
      ? `تم تمييز إعلانك بنجاح حتى ${expiry}.`
      : 'تم تمييز إعلانك بنجاح.';
  }
  return expiry
    ? `تم تثبيت إعلانك بنجاح حتى ${expiry}.`
    : 'تم تثبيت إعلانك بنجاح.';
}
