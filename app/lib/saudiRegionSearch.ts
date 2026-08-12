import type { RegionSelection, SaudiCity, SaudiRegion } from '@/constants/saudiRegions';
import { SAUDI_REGIONS } from '@/constants/saudiRegions';

function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim()
    .toLowerCase();
}

export type RegionSearchHit =
  | { kind: 'region'; region: SaudiRegion; score: number }
  | { kind: 'city'; region: SaudiRegion; city: SaudiCity; score: number };

/** Fuzzy search across Saudi regions and cities (Arabic + English). */
export function searchSaudiRegions(query: string): RegionSearchHit[] {
  const q = normalizeArabic(query);
  const qEn = query.trim().toLowerCase();
  if (!q && !qEn) {
    return SAUDI_REGIONS.flatMap((region) =>
      region.cities.map((city) => ({
        kind: 'city' as const,
        region,
        city,
        score: 0,
      })),
    );
  }

  const hits: RegionSearchHit[] = [];

  for (const region of SAUDI_REGIONS) {
    const regionAr = normalizeArabic(region.nameAr);
    const regionEn = region.nameEn.toLowerCase();
    if (regionAr.includes(q) || regionEn.includes(qEn)) {
      hits.push({ kind: 'region', region, score: regionAr.startsWith(q) ? 0 : 1 });
    }

    for (const city of region.cities) {
      const cityAr = normalizeArabic(city.nameAr);
      const cityEn = city.nameEn.toLowerCase();
      if (cityAr.includes(q) || cityEn.includes(qEn)) {
        hits.push({
          kind: 'city',
          region,
          city,
          score: cityAr.startsWith(q) ? 0 : 1,
        });
      }
    }
  }

  return hits.sort((a, b) => a.score - b.score);
}

/** Match listing location text against a region/city selection. */
export function listingMatchesRegionSelection(
  locationText: string,
  selection: RegionSelection,
): boolean {
  if (selection.type === 'all') return true;

  const haystack = normalizeArabic(locationText);

  if (selection.type === 'city') {
    const cityAr = normalizeArabic(selection.city.nameAr);
    const cityEn = selection.city.nameEn.toLowerCase();
    return haystack.includes(cityAr) || locationText.toLowerCase().includes(cityEn);
  }

  const regionAr = normalizeArabic(selection.region.nameAr);
  if (haystack.includes(regionAr)) return true;

  return selection.region.cities.some((city) => {
    const cityAr = normalizeArabic(city.nameAr);
    return haystack.includes(cityAr);
  });
}

export function regionSelectionLabel(selection: RegionSelection): string {
  if (selection.type === 'all') return 'كل المناطق';
  if (selection.type === 'city') return selection.city.nameAr;
  return selection.region.nameAr.replace(/^منطقة\s/, '');
}
