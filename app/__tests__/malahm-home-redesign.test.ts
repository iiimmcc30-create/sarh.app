import { readFileSync } from 'fs';
import path from 'path';
import { hasButcherRating } from '@/lib/butcherStoreMeta';
import {
  BUTCHER_HOME_OFFERS_LIMIT,
  fetchButcherOffersPreview,
} from '@/services/butcherOffersPreview';

const root = path.join(__dirname, '..');

function src(rel: string) {
  return readFileSync(path.join(root, rel), 'utf8');
}

describe('malahm home redesign', () => {
  it('hides rating overlay when there are no reviews', () => {
    expect(hasButcherRating({ rating: 5, reviewCount: 0 })).toBe(false);
    expect(hasButcherRating({ rating: 4.8, reviewCount: 12 })).toBe(true);
  });

  it('keeps home offers preview at 20 and omits the section when empty', () => {
    const home = src('app/butchers/index.tsx');
    expect(home).toContain('BUTCHER_HOME_OFFERS_LIMIT');
    expect(home).toContain('homeOffers.length > 0');
    expect(home).toContain("title=\"العروض\"");
    expect(home).toContain("'/butchers/offers'");
    expect(home).not.toContain('لا توجد عروض');
    expect(BUTCHER_HOME_OFFERS_LIMIT).toBe(20);
  });

  it('makes market banners full-bleed and keeps carousel logic', () => {
    const slider = src('components/butchers/ButcherMarketBannerSlider.tsx');
    expect(slider).toContain('pagingEnabled');
    expect(slider).toContain('useWindowDimensions');
    expect(slider).not.toContain('slideWidth = width -');
    expect(slider).not.toContain('contentContainerStyle={styles.row}');
    expect(slider).toContain('{ width }');
    expect(slider).not.toContain('borderRadius: 16');
  });

  it('places butcher avatar and rating on the cover image', () => {
    const pick = src('components/butchers/ButcherPickCard.tsx');
    expect(pick).toContain('SarhAvatar');
    expect(pick).toContain('avatarWrap');
    expect(pick).toContain('ratingBadge');
    expect(pick).toContain('position: \'absolute\'');
    expect(pick).not.toContain('butcherSoftCardStyle');
  });

  it('uses a flat header with bare search and cart icons', () => {
    const bar = src('components/butchers/ButchersAppBar.tsx');
    expect(bar).toContain('ButcherLocationBar');
    expect(bar).toContain('accessibilityLabel="السلة"');
    expect(bar).toContain('accessibilityLabel="بحث"');
    expect(bar).toContain("backgroundColor: 'transparent'");
    expect(bar).not.toContain('searchPill');
  });

  it('renders store products as divider rows without card chrome', () => {
    const card = src('components/butcher/ButcherStoreProductCard.tsx');
    const store = src('app/butchers/[id].tsx');
    expect(card).toContain('borderBottomWidth: StyleSheet.hairlineWidth');
    expect(card).toContain("backgroundColor: 'transparent'");
    expect(card).toContain('getRtlRow()');
    expect(store).toContain("label: 'الكل'");
    expect(store).toContain("activeNav.id === 'all'");
    expect(store).toContain('CATEGORY_LABELS');
  });

  it('keeps more rows on the page background', () => {
    const more = src('app/butchers/more.tsx');
    expect(more).not.toContain('menuCardStyle');
    expect(more).toContain('screenRoot');
    expect(more).toContain('SidebarMenuItem');
  });

  it('caps preview offers at the requested limit', async () => {
    const butchers = Array.from({ length: 6 }, (_, i) => ({ id: `b${i}`, country: 'SA' }));
    const fetchMock = jest.fn(async (url: string) => {
      if (url.includes('/api/butchers?sort=rating')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: { butchers } }),
        };
      }
      const id = url.split('/').pop();
      return {
        ok: true,
        json: async () => ({
          data: {
            id,
            offers: [
              { id: `${id}-o1`, titleAr: 'عرض 1', offerPrice: 10, originalPrice: 12, discountPercent: 15 },
              { id: `${id}-o2`, titleAr: 'عرض 2', offerPrice: 8 },
              { id: `${id}-o3`, titleAr: 'عرض 3', offerPrice: 6 },
              { id: `${id}-o4`, titleAr: 'عرض 4', offerPrice: 4 },
            ],
          },
        }),
      };
    });
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    const offers = await fetchButcherOffersPreview(null, 5);
    expect(offers).toHaveLength(5);
    expect(offers.every((o) => o.butcherId && o.titleAr)).toBe(true);
  });
});
