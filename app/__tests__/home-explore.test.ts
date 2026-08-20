import { FALLBACK_HOME_EXPLORE, resolveExploreCard, splitExploreRows } from '../lib/homeExplore';

describe('homeExplore catalog', () => {
  it('maps known destinations to real app routes', () => {
    expect(resolveExploreCard({ destination: 'community' })?.route).toBe('/(tabs)/posts');
    expect(resolveExploreCard({ destination: 'listings' })?.route).toBe('/(tabs)/market');
    expect(resolveExploreCard({ destination: 'listings' })?.descriptionAr).toBe(
      'أحدث الإعلانات للبيع والشراء',
    );
    expect(resolveExploreCard({ destination: 'butchers' })?.route).toBe('/butchers');
    expect(resolveExploreCard({ destination: 'services' })?.route).toBe('/sarh-services');
    expect(resolveExploreCard({ destination: 'news' })?.route).toBe('/news');
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
