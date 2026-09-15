import { API_BASE } from './api';
import { mapButcherFromApi, type ButcherProfile } from './butcherData';
import { fetchButcherMarketBanners, type ButcherMarketBanner } from './butcherMarketBanners';
import {
  BUTCHER_HOME_OFFERS_LIMIT,
  fetchButcherOffersPreview,
  type ButcherOfferPreview,
} from './butcherOffersPreview';

export const BUTCHERS_HOME_TTL_MS = 60_000;
export const BUTCHERS_HOME_SECTION_LIMIT = 12;

export type ButchersHomeSnapshot = {
  picks: ButcherProfile[];
  nearby: ButcherProfile[];
  banners: ButcherMarketBanner[];
  offers: ButcherOfferPreview[];
  fetchedAt: number;
};

export type ButcherSort = 'rating' | 'distance';

type SortedCacheEntry = {
  data: ButcherProfile[];
  raw: Record<string, unknown>[];
  fetchedAt: number;
};

let homeSnapshot: ButchersHomeSnapshot | null = null;
let homeLoadInflight: Promise<ButchersHomeSnapshot> | null = null;
const sortedCache = new Map<string, SortedCacheEntry>();
const sortedInflight = new Map<string, Promise<ButcherProfile[]>>();

function coordsKey(coords?: { lat: number; lng: number } | null): string {
  if (!coords) return '';
  return `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`;
}

export function butcherSortCacheKey(
  sort: ButcherSort,
  coords?: { lat: number; lng: number } | null,
): string {
  if (sort === 'distance' && coords) return `distance:${coordsKey(coords)}`;
  return sort;
}

/** Test-only reset. */
export function resetButchersDirectoryCache() {
  homeSnapshot = null;
  homeLoadInflight = null;
  sortedCache.clear();
  sortedInflight.clear();
}

export function getButchersHomeSnapshot(): ButchersHomeSnapshot | null {
  return homeSnapshot;
}

export function isButchersHomeSnapshotFresh(now = Date.now()): boolean {
  return Boolean(homeSnapshot && now - homeSnapshot.fetchedAt < BUTCHERS_HOME_TTL_MS);
}

export function setButchersHomeSnapshot(
  partial: Partial<Omit<ButchersHomeSnapshot, 'fetchedAt'>> & { fetchedAt?: number },
): ButchersHomeSnapshot {
  homeSnapshot = {
    picks: partial.picks ?? homeSnapshot?.picks ?? [],
    nearby: partial.nearby ?? homeSnapshot?.nearby ?? [],
    banners: partial.banners ?? homeSnapshot?.banners ?? [],
    offers: partial.offers ?? homeSnapshot?.offers ?? [],
    fetchedAt: partial.fetchedAt ?? Date.now(),
  };
  return homeSnapshot;
}

export function getCachedSortedButchers(
  sort: ButcherSort,
  coords?: { lat: number; lng: number } | null,
): ButcherProfile[] | null {
  return sortedCache.get(butcherSortCacheKey(sort, coords))?.data ?? null;
}

export function getCachedSortedButcherRecords(
  sort: ButcherSort,
  coords?: { lat: number; lng: number } | null,
): Record<string, unknown>[] | null {
  return sortedCache.get(butcherSortCacheKey(sort, coords))?.raw ?? null;
}

export function isSortedButchersFresh(
  sort: ButcherSort,
  coords?: { lat: number; lng: number } | null,
  now = Date.now(),
): boolean {
  const entry = sortedCache.get(butcherSortCacheKey(sort, coords));
  return Boolean(entry && now - entry.fetchedAt < BUTCHERS_HOME_TTL_MS);
}

export type CachedButcherLookup = {
  profile: ButcherProfile;
  raw?: Record<string, unknown>;
};

function findFreshRawRecord(id: string, now: number): Record<string, unknown> | undefined {
  for (const entry of sortedCache.values()) {
    if (now - entry.fetchedAt >= BUTCHERS_HOME_TTL_MS) continue;
    const raw = entry.raw.find((row) => String(row.id ?? '') === id);
    if (raw) return raw;
  }
  return undefined;
}

/** TTL-respecting lookup of a butcher already shown on Home / directory lists. */
export function findCachedButcher(id: string, now = Date.now()): CachedButcherLookup | null {
  if (!id) return null;

  if (homeSnapshot && now - homeSnapshot.fetchedAt < BUTCHERS_HOME_TTL_MS) {
    const profile =
      homeSnapshot.picks.find((b) => b.id === id) ??
      homeSnapshot.nearby.find((b) => b.id === id);
    if (profile) {
      return { profile, raw: findFreshRawRecord(id, now) };
    }
  }

  for (const entry of sortedCache.values()) {
    if (now - entry.fetchedAt >= BUTCHERS_HOME_TTL_MS) continue;
    const idx = entry.data.findIndex((b) => b.id === id);
    if (idx >= 0) {
      return { profile: entry.data[idx], raw: entry.raw[idx] };
    }
  }

  return null;
}

export async function fetchSortedButchers(
  sort: ButcherSort,
  options?: {
    lat?: number;
    lng?: number;
    token?: string | null;
    force?: boolean;
  },
): Promise<ButcherProfile[]> {
  const coords =
    options?.lat != null && options?.lng != null
      ? { lat: options.lat, lng: options.lng }
      : null;
  const key = butcherSortCacheKey(sort, coords);
  if (!options?.force) {
    const cached = sortedCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < BUTCHERS_HOME_TTL_MS) {
      return cached.data;
    }
    const inflight = sortedInflight.get(key);
    if (inflight) return inflight;
  }

  const promise = (async () => {
    const headers: HeadersInit = options?.token
      ? { Authorization: `Bearer ${options.token}` }
      : {};
    const params = new URLSearchParams({ sort });
    if (sort === 'distance' && coords) {
      params.set('lat', String(coords.lat));
      params.set('lng', String(coords.lng));
    }
    const res = await fetch(`${API_BASE}/api/butchers?${params.toString()}`, { headers });
    if (!res.ok) throw new Error('butchers_fetch_failed');
    const json = await res.json().catch(() => ({}));
    if (!json.success || !Array.isArray(json.data?.butchers)) {
      throw new Error('butchers_fetch_failed');
    }
    const raw = (json.data.butchers as Record<string, unknown>[]).filter(
      (b) => (b.country || 'SA') !== 'EG',
    );
    const data = raw.map((b) => mapButcherFromApi(b));
    sortedCache.set(key, { data, raw, fetchedAt: Date.now() });
    return data;
  })().finally(() => {
    if (sortedInflight.get(key) === promise) sortedInflight.delete(key);
  });

  sortedInflight.set(key, promise);
  return promise;
}

export async function loadButchersHome(
  accessToken?: string | null,
  options?: { force?: boolean },
): Promise<ButchersHomeSnapshot> {
  if (!options?.force && isButchersHomeSnapshotFresh() && homeSnapshot) {
    return homeSnapshot;
  }
  if (!options?.force && homeLoadInflight) return homeLoadInflight;

  const promise = (async () => {
    const rated = await fetchSortedButchers('rating', {
      token: accessToken,
      force: options?.force,
    });
    const ratingRecords = getCachedSortedButcherRecords('rating') ?? [];
    const [banners, offers] = await Promise.all([
      fetchButcherMarketBanners(),
      fetchButcherOffersPreview(accessToken, BUTCHER_HOME_OFFERS_LIMIT, {
        records: ratingRecords,
      }).catch(() => homeSnapshot?.offers ?? []),
    ]);
    return setButchersHomeSnapshot({
      picks: rated.slice(0, BUTCHERS_HOME_SECTION_LIMIT),
      nearby: (homeSnapshot?.nearby.length
        ? homeSnapshot.nearby
        : rated
      ).slice(0, BUTCHERS_HOME_SECTION_LIMIT),
      banners,
      offers,
    });
  })().finally(() => {
    if (homeLoadInflight === promise) homeLoadInflight = null;
  });

  homeLoadInflight = promise;
  return promise;
}
