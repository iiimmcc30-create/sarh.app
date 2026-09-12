import {
  butcherChromeBg,
  butcherChromeTone,
  butcherMarket,
  butcherMeatBg,
  butcherSearchFill,
} from '@/constants/butcherMarket';

describe('butcher chrome tones', () => {
  it('alternates only meat and mint from the banner index', () => {
    expect(butcherChromeTone(0)).toBe('meat');
    expect(butcherChromeTone(1)).toBe('mint');
    expect(butcherChromeTone(2)).toBe('meat');
    expect(butcherChromeTone(3)).toBe('mint');
  });

  it('uses the meat and light-green fills, never a per-banner image color', () => {
    expect(butcherChromeBg('light', 'meat')).toBe(butcherMarket.meatLight);
    expect(butcherChromeBg('light', 'mint')).toBe(butcherMarket.mintLight);
    expect(butcherMeatBg('light')).toBe(butcherMarket.meatLight);
    expect(butcherSearchFill('light', 'mint')).toBe(butcherMarket.searchMintLight);
    expect(butcherSearchFill('light')).toBe(butcherMarket.searchLight);
  });
});
