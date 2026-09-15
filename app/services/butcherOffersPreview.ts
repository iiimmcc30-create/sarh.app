import { API_BASE } from '@/services/api';
import { resolveMediaUrl } from '@/services/media';

export const BUTCHER_HOME_OFFERS_LIMIT = 20;
const MAX_BUTCHERS = 12;

export type ButcherOfferPreview = {
  id: string;
  butcherId: string;
  butcherNameAr?: string;
  butcherLogo?: string;
  titleAr: string;
  image?: string;
  originalPrice?: number;
  offerPrice?: number;
  discountPercent?: number;
};

export type ButcherOfferPreviewOptions = {
  /** Already-fetched butcher list records — skips GET /api/butchers?sort=rating. */
  records?: Record<string, unknown>[];
};

function mapOffers(
  raw: unknown,
  butcherId: string,
  butcherNameAr?: string,
  butcherLogo?: string,
): ButcherOfferPreview[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((o: Record<string, unknown>) => ({
    id: String(o.id),
    butcherId,
    butcherNameAr,
    butcherLogo: resolveMediaUrl(butcherLogo) ?? butcherLogo,
    titleAr: String(o.titleAr || o.titleEn || 'عرض'),
    image: resolveMediaUrl(o.image as string | undefined) ?? undefined,
    originalPrice: typeof o.originalPrice === 'number' ? o.originalPrice : undefined,
    offerPrice: typeof o.offerPrice === 'number' ? o.offerPrice : undefined,
    discountPercent: typeof o.discountPercent === 'number' ? o.discountPercent : undefined,
  }));
}

function previewCandidates(
  list: Record<string, unknown>[],
): Record<string, unknown>[] {
  return list
    .filter((b) => (b.country || 'SA') !== 'EG')
    .slice(0, MAX_BUTCHERS);
}

export function butcherRecordsHaveEmbeddedOffers(
  records: Record<string, unknown>[],
): boolean {
  return records.some((b) => Array.isArray(b.offers));
}

export function offersPreviewFromRecords(
  records: Record<string, unknown>[],
  limit = BUTCHER_HOME_OFFERS_LIMIT,
): ButcherOfferPreview[] {
  const collected: ButcherOfferPreview[] = [];
  for (const b of previewCandidates(records)) {
    const id = String(b.id ?? '');
    if (!id) continue;
    const nameAr = String(b.nameAr || b.name || '');
    const logo =
      resolveMediaUrl((b.logo || b.cover) as string | undefined) ??
      (typeof b.logo === 'string' ? b.logo : undefined) ??
      (typeof b.cover === 'string' ? b.cover : undefined);
    for (const offer of mapOffers(b.offers, id, nameAr, logo)) {
      collected.push(offer);
      if (collected.length >= limit) return collected;
    }
  }
  return collected;
}

async function offersPreviewFromDetails(
  records: Record<string, unknown>[],
  accessToken?: string | null,
  limit = BUTCHER_HOME_OFFERS_LIMIT,
): Promise<ButcherOfferPreview[]> {
  const headers: HeadersInit = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
  const candidates = previewCandidates(records);
  const collected: ButcherOfferPreview[] = [];
  for (const batchStart of [0, 4, 8]) {
    if (collected.length >= limit) break;
    const batch = candidates.slice(batchStart, batchStart + 4);
    if (!batch.length) break;
    const details = await Promise.all(
      batch.map(async (b) => {
        try {
          const res = await fetch(`${API_BASE}/api/butchers/${b.id}`, { headers });
          if (!res.ok) return [] as ButcherOfferPreview[];
          const json = await res.json();
          const d = json?.data;
          if (!d?.id) return [];
          const nameAr = String(d.nameAr || d.name || b.nameAr || b.name || '');
          const logo =
            resolveMediaUrl((d.logo || d.cover || b.logo || b.cover) as string | undefined) ??
            undefined;
          return mapOffers(d.offers, String(d.id), nameAr, logo);
        } catch {
          return [] as ButcherOfferPreview[];
        }
      }),
    );
    for (const group of details) {
      for (const offer of group) {
        collected.push(offer);
        if (collected.length >= limit) return collected;
      }
    }
  }
  return collected;
}

async function fetchRatingListRecords(
  accessToken?: string | null,
): Promise<Record<string, unknown>[]> {
  const headers: HeadersInit = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
  try {
    const listRes = await fetch(`${API_BASE}/api/butchers?sort=rating`, { headers });
    const listJson = (await listRes.json().catch(() => ({}))) as Record<string, unknown>;
    const rawList = (listJson.data as { butchers?: unknown } | undefined)?.butchers;
    return Array.isArray(rawList) ? (rawList as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

/** Preview rail for butchers home — prefers already-loaded list records. */
export async function fetchButcherOffersPreview(
  accessToken?: string | null,
  limit = BUTCHER_HOME_OFFERS_LIMIT,
  options?: ButcherOfferPreviewOptions,
): Promise<ButcherOfferPreview[]> {
  const records =
    options?.records ?? (await fetchRatingListRecords(accessToken));
  if (records.length === 0) return [];
  if (butcherRecordsHaveEmbeddedOffers(records)) {
    return offersPreviewFromRecords(records, limit);
  }
  return offersPreviewFromDetails(records, accessToken, limit);
}
