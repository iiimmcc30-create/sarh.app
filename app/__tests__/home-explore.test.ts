import { FALLBACK_HOME_EXPLORE, resolveExploreCard, splitExploreRows } from '../lib/homeExplore';

describe('homeExplore catalog', () => {
  it('maps known destinations to real app routes', () => {
    expect(resolveExploreCard({ destination: 'community' })?.route).toBe('/(tabs)/posts');
    expect(resolveExploreCard({ destination: 'community' })?.titleAr).toBe('مجتمع سرح');
    expect(resolveExploreCard({ destination: 'community' })?.descriptionAr).toBe(
      'نقاشات-تجارب-اسئلة-معرفه',
    );
    expect(resolveExploreCard({ destination: 'listings' })?.route).toBe('/(tabs)/market');
    expect(resolveExploreCard({ destination: 'listings' })?.titleAr).toBe('السوق');
    expect(resolveExploreCard({ destination: 'listings' })?.descriptionAr).toBe(
      'اعلانات البيع والشراء والمنتجات',
    );
    expect(resolveExploreCard({ destination: 'butchers' })?.descriptionAr).toBe(
      'تصفح منتجات الملاحم والطلبات',
    );
    expect(resolveExploreCard({ destination: 'services' })?.descriptionAr).toBe(
      'الخدمات الالكترونية-التراخيص-التصاريح',
    );
    expect(resolveExploreCard({ destination: 'news' })?.titleAr).toBe('قطاع الأخبار');
    expect(resolveExploreCard({ destination: 'news' })?.descriptionAr).toBe(
      'اخبار الوزارة-القرارات-الفعاليات',
    );
    expect(resolveExploreCard({ destination: 'live' })?.route).toBe('/(tabs)/live');
    expect(resolveExploreCard({ destination: 'promote' })?.route).toBe('/promote');
  });

  it('ignores unknown destinations instead of inventing routes', () => {
    expect(resolveExploreCard({ destination: 'unknown' })).toBeNull();
  });

  it('keeps a fallback row that does not include promote', () => {
    expect(FALLBACK_HOME_EXPLORE.map((item) => item.destination)).toEqual([
      'community',
      'butchers',
      'listings',
      'services',
      'news',
    ]);
  });

  it('splits cards into two adjacent rows (3+2 for the default five)', () => {
    expect(splitExploreRows(['a']).bottom).toEqual([]);
    expect(splitExploreRows([1, 2, 3, 4, 5])).toEqual({
      top: [1, 2, 3],
      bottom: [4, 5],
    });
    expect(splitExploreRows([1, 2, 3, 4, 5, 6]).top).toHaveLength(3);
    expect(splitExploreRows([1, 2, 3, 4, 5, 6]).bottom).toHaveLength(3);
  });
});
