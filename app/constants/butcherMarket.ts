/** Butchers-market chrome — meat or mint only; never derived from banner pixels. */
export const butcherMarket = {
  meatLight: '#E8C4B4',
  meatDark: '#3F2A26',
  mintLight: '#D4EBD8',
  mintDark: '#1E3326',
  searchLight: '#FFF8F4',
  searchDark: '#2A1C19',
  searchMintLight: '#F2FBF4',
  searchMintDark: '#16241C',
  seeAll: '#C43C3C',
  pin: '#2E9B57',
} as const;

export type ButcherChromeTone = 'meat' | 'mint';

export function butcherChromeTone(bannerIndex: number): ButcherChromeTone {
  return bannerIndex % 2 === 0 ? 'meat' : 'mint';
}

export function butcherChromeBg(
  scheme: 'light' | 'dark',
  tone: ButcherChromeTone = 'meat',
): string {
  if (tone === 'mint') {
    return scheme === 'dark' ? butcherMarket.mintDark : butcherMarket.mintLight;
  }
  return scheme === 'dark' ? butcherMarket.meatDark : butcherMarket.meatLight;
}

export function butcherMeatBg(scheme: 'light' | 'dark'): string {
  return butcherChromeBg(scheme, 'meat');
}

export function butcherSearchFill(
  scheme: 'light' | 'dark',
  tone: ButcherChromeTone = 'meat',
): string {
  if (tone === 'mint') {
    return scheme === 'dark' ? butcherMarket.searchMintDark : butcherMarket.searchMintLight;
  }
  return scheme === 'dark' ? butcherMarket.searchDark : butcherMarket.searchLight;
}
