import { API_BASE } from '@/services/api';
import {
  FALLBACK_HOME_EXPLORE,
  resolveExploreCard,
  type HomeExploreCard,
} from '@/lib/homeExplore';

export async function fetchHomeExploreSections(): Promise<HomeExploreCard[]> {
  try {
    const res = await fetch(`${API_BASE}/api/home/explore`);
    if (!res.ok) return FALLBACK_HOME_EXPLORE;
    const json = (await res.json()) as { data?: { sections?: unknown[] } };
    const rows = Array.isArray(json?.data?.sections) ? json.data.sections : [];
    const mapped = rows
      .map((row) => resolveExploreCard((row ?? {}) as Partial<HomeExploreCard>))
      .filter((row): row is HomeExploreCard => Boolean(row));
    return mapped.length > 0 ? mapped : FALLBACK_HOME_EXPLORE;
  } catch {
    return FALLBACK_HOME_EXPLORE;
  }
}
