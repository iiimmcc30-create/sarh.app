import { API_BASE } from './api';
import { authFetch } from './authFetch';
import { parseApiError } from './apiError';

export type PlanPromoteType = 'featured' | 'pinned' | 'both';

export async function applyListingPlanPromotion(
  listingId: string,
  type: PlanPromoteType,
): Promise<{ ok: boolean; error?: string }> {
  const body =
    type === 'both'
      ? { featured: true, pinned: true }
      : type === 'featured'
        ? { featured: true }
        : { pinned: true };

  try {
    const res = await authFetch(`${API_BASE}/api/listings/${listingId}/plan-promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: await parseApiError(res) };
  } catch {
    return { ok: false, error: 'تعذّر الاتصال بالخادم' };
  }
}
