import * as fs from 'fs';
import * as path from 'path';
import {
  FALLBACK_HOME_EXPLORE,
  resolveExploreCard,
  splitExploreRows,
  usesExploreSarhLogoMark,
} from '../lib/homeExplore';

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

describe('Explore Sarh logo mark', () => {
  it('uses the official mark on community, butchers, listings, services, and news', () => {
    expect(usesExploreSarhLogoMark('community')).toBe(true);
    expect(usesExploreSarhLogoMark('butchers')).toBe(true);
    expect(usesExploreSarhLogoMark('listings')).toBe(true);
    expect(usesExploreSarhLogoMark('services')).toBe(true);
    expect(usesExploreSarhLogoMark('news')).toBe(true);
    expect(usesExploreSarhLogoMark('live')).toBe(false);
    expect(usesExploreSarhLogoMark('promote')).toBe(false);
  });

  it('wires SarhLogoMark into those cards at top-center', () => {
    const section = fs.readFileSync(
      path.join(__dirname, '../components/feature/ExploreSarhSection.tsx'),
      'utf8',
    );
    const mark = fs.readFileSync(
      path.join(__dirname, '../components/ui/SarhLogoMark.tsx'),
      'utf8',
    );
    expect(section).toContain('SarhLogoMark');
    expect(section).toContain('iconRingTopCenter');
    expect(section).toContain('usesExploreSarhLogoMark');
    expect(mark).toContain('assets/images/logo.png');
    expect(mark).toContain('WAVE_BOTTOM');
    expect(mark).toContain('WAVE_TOP');
    expect(mark).toContain('DIAMOND');
    expect(mark).toContain('fill={color}');
    expect(mark).not.toContain('AppIcon');
  });
});

describe('HomeAppBar chrome', () => {
  it('places more then notifications then search as separate controls', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../components/ui/HomeAppBar.tsx'),
      'utf8',
    );
    const moreAt = src.indexOf('accessibilityLabel="المزيد"');
    const bellAt = src.indexOf('<NotificationBellButton');
    const searchAt = src.indexOf('accessibilityRole="search"');
    expect(moreAt).toBeGreaterThan(-1);
    expect(bellAt).toBeGreaterThan(moreAt);
    expect(searchAt).toBeGreaterThan(bellAt);
    expect(src).toContain('iconPair');
    expect(src).toContain("direction: 'ltr'");
  });

  it('places filter and sort left of market search, with a featured star on the right', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../components/market/MarketAppBar.tsx'),
      'utf8',
    );
    const filterAt = src.indexOf('accessibilityLabel="تصفية"');
    const sortAt = src.indexOf('accessibilityLabel={sortLabel}');
    const searchAt = src.indexOf('accessibilityRole="search"');
    const starAt = src.indexOf('accessibilityLabel="الإعلانات المميزة"');
    expect(filterAt).toBeGreaterThan(-1);
    expect(sortAt).toBeGreaterThan(filterAt);
    expect(searchAt).toBeGreaterThan(sortAt);
    expect(starAt).toBeGreaterThan(searchAt);
    expect(src).toContain('styles.track');
    expect(src).toContain('flex: 1');
    expect(src).toContain('size={ICON}');
    expect(src).toContain('ابحث في السوق');
    expect(src).not.toContain('HomeAppBar');
    expect(src).not.toContain('المزيد');
    expect(src).not.toContain('NotificationBellButton');
  });

  it('darkens Explore cards slightly from the elevated surface in dark mode', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../components/feature/ExploreSarhSection.tsx'),
      'utf8',
    );
    expect(src).toContain("scheme === 'dark' ? '#0D202C'");
    expect(src).not.toContain('#0B1A2E');
  });
});
