import * as fs from 'fs';
import * as path from 'path';
import {
  FALLBACK_HOME_EXPLORE,
  partitionExploreSections,
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
    expect(resolveExploreCard({ destination: 'services' })?.titleAr).toBe(
      'خدمات وزارة البيئة والمياه والزراعة',
    );
    expect(resolveExploreCard({ destination: 'services' })?.descriptionAr).toBe(
      'الخدمات الإلكترونية - التراخيص - التصاريح',
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

  it('partitions services into a full-width featured card and orders the 2×2 grid', () => {
    const { grid, featured } = partitionExploreSections(FALLBACK_HOME_EXPLORE);
    expect(featured?.destination).toBe('services');
    expect(featured?.titleAr).toBe('خدمات وزارة البيئة والمياه والزراعة');
    expect(grid.map((item) => item.destination)).toEqual([
      'listings',
      'butchers',
      'community',
      'news',
    ]);
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

  it('uses a 2×2 grid with a full-width ministry card', () => {
    const section = fs.readFileSync(
      path.join(__dirname, '../components/feature/ExploreSarhSection.tsx'),
      'utf8',
    );
    expect(section).toContain('partitionExploreSections');
    expect(section).toContain('gridRow');
    expect(section).toContain('featuredCard');
    expect(section).toContain('OFFICIAL_APP_FONT');
    expect(section).not.toContain('ExploreStrip');
    expect(section).not.toContain('ScrollView');
  });
});

describe('login screen layout', () => {
  it('uses minimal Sarh login: phone + password, square logo, locale copy, no country picker', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/auth/phone.tsx'),
      'utf8',
    );
    expect(src).toContain('getRtlText');
    expect(src).toContain('isAppRtl');
    expect(src).toContain('useAuthCopy');
    expect(src).toContain('shape="square"');
    expect(src).toContain('signInWithPassword');
    expect(src).toContain('forgot-password');
    expect(src).toContain('OFFICIAL_APP_FONT');
    expect(src).not.toContain('countryBtn');
    expect(src).not.toContain('COUNTRY_CODES');
    expect(src).not.toContain('tabBar');
    expect(src).not.toContain('styles.searchBar');
  });
});

describe('auth welcome screen', () => {
  it('shows square brand mark and start / have-account actions', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/auth/welcome.tsx'),
      'utf8',
    );
    expect(src).toContain('SarhLogoMark');
    expect(src).toContain('/auth/register');
    expect(src).toContain('/auth/phone');
    expect(src).toContain('useAuthCopy');
  });
});

describe('progressive register screen', () => {
  it('steps phone → name → identity → password → otp without auth API changes', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../app/auth/register.tsx'),
      'utf8',
    );
    expect(src).toContain("step === 'phone'");
    expect(src).toContain("step === 'name'");
    expect(src).toContain("step === 'identity'");
    expect(src).toContain("step === 'password'");
    expect(src).toContain("step === 'otp'");
    expect(src).toContain('sendOtp');
    expect(src).toContain('verifyOtp');
    expect(src).toContain('register(');
    expect(src).toContain('shape="square"');
    expect(src).toContain('updateAccountSettings');
  });
});

describe('HomeAppBar chrome', () => {
  it('uses flat home header with notifications, search icon, and profile identity', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../components/ui/HomeAppBar.tsx'),
      'utf8',
    );
    const bellAt = src.indexOf('<NotificationBellButton');
    const searchAt = src.indexOf('accessibilityLabel="بحث"');
    const chevronAt = src.indexOf('accessibilityLabel="قائمة الحساب"');
    const avatarAt = src.indexOf('accessibilityLabel="الملف الشخصي"');
    expect(bellAt).toBeGreaterThan(-1);
    expect(searchAt).toBeGreaterThan(bellAt);
    expect(chevronAt).toBeGreaterThan(searchAt);
    expect(avatarAt).toBeGreaterThan(chevronAt);
    expect(src).toContain('HomeProfileMenu');
    expect(src).toContain('angle-down');
    expect(src).not.toContain("direction: 'ltr'");
    expect(src).not.toContain('styles.searchBar');
    expect(src).not.toContain('more-vertical');
    expect(src).toContain('bare');
    expect(src).toContain('backgroundColor: \'transparent\'');
    expect(src).toContain('minHeight: BAR_H');
    expect(src).toContain('fontSize: 17');
  });

  it('embeds filter inside market search bar with featured star on the right', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../components/market/MarketAppBar.tsx'),
      'utf8',
    );
    const filterAt = src.indexOf('accessibilityLabel="تصفية"');
    const searchAt = src.indexOf('accessibilityRole="search"');
    const starAt = src.indexOf('accessibilityLabel="الإعلانات المميزة"');
    expect(filterAt).toBeGreaterThan(-1);
    expect(searchAt).toBeGreaterThan(filterAt);
    expect(starAt).toBeGreaterThan(searchAt);
    expect(src).toContain('styles.searchBar');
    expect(src).toContain('styles.searchTap');
    expect(src).toContain('TOOL_ICON');
    expect(src).toContain('ابحث في السوق');
    expect(src).not.toContain('sort-alt');
    expect(src).not.toContain('sortLabel');
    expect(src).not.toContain('HomeAppBar');
    expect(src).not.toContain('المزيد');
    expect(src).not.toContain('NotificationBellButton');
  });

  it('pairs sort and category actions beside nearby in the market filter row', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../components/market/MarketFilterBar.tsx'),
      'utf8',
    );
    const nearbyAt = src.indexOf('label="القريب"');
    const sortBarAt = src.indexOf('sortCategoryBar', nearbyAt);
    const sortIconAt = src.indexOf('name="sort-alt"', sortBarAt);
    const categoryAt = src.indexOf('التصنيف', sortBarAt);
    expect(nearbyAt).toBeGreaterThan(-1);
    expect(sortBarAt).toBeGreaterThan(nearbyAt);
    expect(sortIconAt).toBeGreaterThan(sortBarAt);
    expect(categoryAt).toBeGreaterThan(sortBarAt);
    expect(src).toContain('options-outline');
    expect(src).toContain('onCategoryPress');
  });

  it('uses elevated listing-card surface for compact market chips', () => {
    const chipSrc = fs.readFileSync(
      path.join(__dirname, '../components/ui/FilterChip.tsx'),
      'utf8',
    );
    expect(chipSrc).toContain('compact ? colors.bgElevated');
    expect(chipSrc).toContain('const idleBorderWidth = compact ? 0');
  });

  it('uses the same elevated surface as listing and post cards', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../components/feature/ExploreSarhSection.tsx'),
      'utf8',
    );
    expect(src).toContain('backgroundColor: colors.bgSurface');
    expect(src).toContain('borderRadius: CARD_RADIUS');
    expect(src).not.toContain('borderRadius: 14');
  });
});
