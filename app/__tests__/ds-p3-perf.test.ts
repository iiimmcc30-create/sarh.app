import { readFileSync } from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');

function src(rel: string) {
  return readFileSync(path.join(root, rel), 'utf8');
}

describe('P3 performance — frozen visuals', () => {
  it('does not restyle ListingCard, PostItem, or FloatingTabBar', () => {
    const card = src('components/feature/ListingCard.tsx');
    const post = src('components/feature/PostItem.tsx');
    const tabs = src('components/navigation/FloatingTabBar.tsx');
    expect(card).toContain('export const ListingCard');
    expect(post).toContain("from '@/components/ui/AppText'");
    expect(tabs).toContain("label: 'مجتمع سرح'");
    expect(tabs).not.toContain('SarhButton');
  });
});

describe('P3 performance — startup and navigation', () => {
  it('restores cached auth before waiting on token refresh', () => {
    const auth = src('contexts/AuthContext.tsx');
    expect(auth).toContain('setIsLoading(false)');
    expect(auth).toContain('Cached session is enough for first paint');
    expect(auth).not.toMatch(/setActiveMode\(parseActiveMode\(mode\)\);\s*await refreshSessionRef/);
  });

  it('freezes inactive native screens except live routes', () => {
    const layout = src('app/_layout.tsx');
    expect(layout).toContain('enableFreeze(true)');
    expect(layout).toContain('freezeOnBlur: true');
    expect(layout).toContain("name=\"live/watch/[id]\"");
    expect(layout).toContain('freezeOnBlur: false');
    expect(src('app/(tabs)/_layout.tsx')).toContain('freezeOnBlur: true');
  });

  it('skips redundant RTL setup when locale is unchanged', () => {
    const rtl = src('lib/rtl.ts');
    expect(rtl).toContain('if (activeLocale === locale && activeRtl === rtl)');
  });
});

describe('P3 performance — lists images state', () => {
  it('tunes AppFlatList more tightly on Android', () => {
    const list = src('components/ui/AppFlatList.tsx');
    expect(list).toContain("Platform.OS === 'android' ? 7 : 11");
    expect(list).toContain("Platform.OS === 'android' ? 6 : 8");
  });

  it('keeps expo-image cache and downscaling on AppImage', () => {
    const image = src('components/ui/AppImage.tsx');
    expect(image).toContain('cachePolicy="memory-disk"');
    expect(image).toContain('allowDownscaling');
    expect(image).toContain('recyclingKey');
  });

  it('prefetches feed media after cache/network without blocking UI', () => {
    const ctx = src('contexts/AppContext.tsx');
    expect(ctx).toContain('prefetchRemoteImages');
    expect(ctx).toContain('AppUserContext');
    expect(src('lib/prefetchRemoteImages.ts')).toContain('InteractionManager.runAfterInteractions');
    expect(src('lib/prefetchRemoteImages.ts')).toContain('Image.prefetch');
  });

  it('lets Home subscribe only to the user slice', () => {
    const home = src('app/(tabs)/index.tsx');
    expect(home).toContain('useAppUser');
    expect(home).not.toContain('useApp()');
    expect(home).toContain('if (!hasStoriesData.current) setStoriesLoading(true)');
  });

  it('does not add Reanimated or FlashList as production dependencies', () => {
    const pkg = src('package.json');
    expect(pkg).not.toContain('react-native-reanimated');
    expect(pkg).not.toContain('@shopify/flash-list');
  });
});
