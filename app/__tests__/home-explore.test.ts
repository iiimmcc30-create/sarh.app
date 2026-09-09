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
    expect(resolveExploreCard({ destination: 'services' })?.route).toBe('/ministry');
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

  it('uses a full-bleed butchers hero instead of explore cards', () => {
    const section = fs.readFileSync(
      path.join(__dirname, '../components/feature/ExploreSarhSection.tsx'),
      'utf8',
    );
    expect(section).toContain('استكشف سرح');
    expect(section).toContain('ملاحم سرح');
    expect(section).toContain('تصفح أفضل منتجات اللحوم بكل أمان وثقة');
    expect(section).toContain('تصفح الملاحم');
    expect(section).toContain("safePush('/butchers'");
    expect(section).toContain('getRtlRow');
    expect(section).toContain("width: '100%'");
    expect(section).not.toContain('CARD_RADIUS');
    expect(section).not.toContain('partitionExploreSections');
    expect(section).not.toContain('gridRow');
    expect(section).not.toContain('featuredCard');
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
    const avatarAt = src.indexOf('accessibilityLabel="القائمة الجانبية"');
    const searchAt = src.indexOf('accessibilityLabel="بحث"');
    const bellAt = src.indexOf('<NotificationBellButton');
    expect(avatarAt).toBeGreaterThan(-1);
    expect(searchAt).toBeGreaterThan(avatarAt);
    expect(bellAt).toBeGreaterThan(searchAt);
    expect(src).toContain('onAvatarPress');
    expect(src).not.toContain('HomeProfileMenu');
    expect(src).not.toContain('angle-down');
    expect(src).not.toContain("direction: 'ltr'");
    expect(src).not.toContain('styles.searchBar');
    expect(src).not.toContain('more-vertical');
    expect(src).toContain('bare');
    expect(src).toContain('backgroundColor: \'transparent\'');
    expect(src).toContain('minHeight: BAR_H');
    expect(src).toContain('variant="heading3"');
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
      path.join(__dirname, '../components/ui/filterChipAppearance.tsx'),
      'utf8',
    );
    expect(chipSrc).toContain('compact ? colors.bgElevated');
    expect(chipSrc).toContain('const idleBorderWidth = compact ? 0');
  });

  it('keeps the butchers hero edge-to-edge without card chrome', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../components/feature/ExploreSarhSection.tsx'),
      'utf8',
    );
    expect(src).toContain('backgroundColor: colors.background');
    expect(src).not.toContain('paddingHorizontal: SIDE_PAD');
    expect(src).not.toContain('CARD_RADIUS');
    expect(src).not.toContain('menuCardStyle');
  });

  it('loads ministry services from the official API on home', () => {
    const home = fs.readFileSync(path.join(__dirname, '../app/(tabs)/index.tsx'), 'utf8');
    const card = fs.readFileSync(
      path.join(__dirname, '../components/feature/HomeMinistryOrgCard.tsx'),
      'utf8',
    );
    expect(home).toContain('fetchOfficialServices');
    expect(home).toContain('HomeMinistryOrgCard');
    expect(home).not.toContain('أحدث المنشورات');
    expect(card).toContain('خدمات الوزارة');
    expect(card).toContain("safePush('/ministry'");
    expect(home).toContain('fetchMinistryAccount');
    expect(card).toContain('account?.arabicName');
    expect(card).toContain('formatServiceCountLabel');
  });
});

describe('Home design-system adoption', () => {
  const home = fs.readFileSync(path.join(__dirname, '../app/(tabs)/index.tsx'), 'utf8');
  const appBar = fs.readFileSync(path.join(__dirname, '../components/ui/HomeAppBar.tsx'), 'utf8');
  const explore = fs.readFileSync(
    path.join(__dirname, '../components/feature/ExploreSarhSection.tsx'),
    'utf8',
  );
  const ministry = fs.readFileSync(
    path.join(__dirname, '../components/feature/HomeMinistryOrgCard.tsx'),
    'utf8',
  );
  const stories = fs.readFileSync(
    path.join(__dirname, '../components/feature/EditorialStoriesBar.tsx'),
    'utf8',
  );
  const listingCard = fs.readFileSync(
    path.join(__dirname, '../components/feature/ListingCard.tsx'),
    'utf8',
  );

  it('uses SarhSurface, AppText, and matching primitives on Home-owned files', () => {
    expect(home).toContain("from '@/design-system/components'");
    expect(home).toContain('SarhSurface');
    expect(home).toContain('tone="background"');
    expect(appBar).toContain('SarhAvatar');
    expect(appBar).toContain('SarhIconButton');
    expect(appBar).toContain('chrome="ghost"');
    expect(appBar).toContain('variant="heading3"');
    expect(explore).toContain('variant="heading2"');
    expect(explore).toContain('variant="heading1"');
    expect(explore).toContain('variant="bodySmall"');
    expect(explore).toContain('variant="label"');
    expect(ministry).toContain('SarhCard');
    expect(ministry).toContain('SarhButton');
    expect(ministry).toContain('SarhAvatar');
    expect(ministry).toContain('variant="inverse"');
    expect(stories).toContain('SarhCard');
    expect(stories).toContain('variant="plain"');
    expect(stories).toContain('variant="caption"');
  });

  it('does not remap Home copy through the legacy Bold AppText path', () => {
    for (const src of [appBar, explore, ministry, stories]) {
      expect(src).not.toContain("from '@/components/ui/AppText'");
      expect(src).not.toContain('OFFICIAL_APP_FONT');
      expect(src).not.toContain('resolveAppFontFace');
      expect(src).not.toContain("fontWeight: '700'");
    }
  });

  it('does not wrap marketplace listing ads or the edge-to-edge butchers hero in SarhCard', () => {
    expect(explore).not.toContain('SarhCard');
    expect(explore).not.toContain('CARD_RADIUS');
    expect(listingCard).not.toContain('@/design-system');
    expect(listingCard).not.toContain('SarhCard');
  });

  it('keeps Home RTL helpers and button labels', () => {
    expect(appBar).toContain('getRtlRow');
    expect(explore).toContain('getRtlRow');
    expect(ministry).toContain('getRtlRow');
    expect(stories).toContain('getRtlRow');
    expect(appBar).toContain('accessibilityRole="button"');
    expect(explore).toContain('accessibilityRole="button"');
    expect(ministry).toContain('accessibilityRole="button"');
    expect(stories).toContain('accessibilityRole="button"');
    expect(appBar).toContain('accessibilityLabel="بحث"');
  });

  it('does not introduce a second Home-only primitive set', () => {
    expect(home).not.toContain('HomeButton');
    expect(home).not.toContain('HomeCard');
    expect(explore).not.toContain('PrimaryButton');
    expect(ministry).not.toContain('PrimaryButton');
  });

  it('keeps the existing Home section order and does not invent new sections', () => {
    const storiesAt = home.indexOf('<EditorialStoriesBar');
    const exploreAt = home.indexOf('<ExploreSarhSection');
    const ministryAt = home.indexOf('<HomeMinistryOrgCard');
    expect(storiesAt).toBeGreaterThan(-1);
    expect(exploreAt).toBeGreaterThan(storiesAt);
    expect(ministryAt).toBeGreaterThan(exploreAt);
    expect(home).not.toContain('ListingCard');
    expect(home).not.toContain('Marketplace');
    expect(explore).toContain('ملاحم سرح');
    expect(explore).toContain("safePush('/butchers'");
    expect(ministry).toContain('formatServiceCountLabel');
  });
});

