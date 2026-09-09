/** Butchers-market chrome — Hunger-like meat wash for header + banner only. */
export const butcherMarket = {
  meatLight: '#E8C4B4',
  meatDark: '#3F2A26',
  searchLight: '#FFF8F4',
  searchDark: '#2A1C19',
  seeAll: '#C43C3C',
  pin: '#2E9B57',
} as const;

export function butcherMeatBg(scheme: 'light' | 'dark'): string {
  return scheme === 'dark' ? butcherMarket.meatDark : butcherMarket.meatLight;
}

export function butcherSearchFill(scheme: 'light' | 'dark'): string {
  return scheme === 'dark' ? butcherMarket.searchDark : butcherMarket.searchLight;
}
