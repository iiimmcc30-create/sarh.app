import {
  appFont,
  APP_FONT_FACES,
  APP_FONT_NAME,
  OFFICIAL_APP_FONT,
  POSTS_FONT_FACES,
  postsFont,
  resolveAppFontFace,
  resolveDesignFontFace,
  resolvePostsFontFace,
} from '@/constants/fonts';
import { typography } from '@/constants/theme';
import packageJson from '../package.json';

describe('resolveAppFontFace', () => {
  it('maps weights to Tajawal faces without forcing Bold', () => {
    expect(resolveAppFontFace('400')).toEqual({
      fontFamily: appFont.regular,
      fontWeight: '400',
    });
    expect(resolveAppFontFace('500')).toEqual({
      fontFamily: appFont.medium,
      fontWeight: '500',
    });
    expect(resolveAppFontFace('600')).toEqual({
      fontFamily: appFont.semibold,
      fontWeight: '600',
    });
    expect(resolveAppFontFace('700')).toEqual({
      fontFamily: appFont.bold,
      fontWeight: '700',
    });
    expect(resolveAppFontFace('normal', appFont.medium)).toEqual({
      fontFamily: appFont.regular,
      fontWeight: '400',
    });
  });

  it('keeps a separate design-system resolver with real Tajawal weights', () => {
    expect(resolveDesignFontFace('400')).toEqual({
      fontFamily: appFont.regular,
      fontWeight: '400',
    });
    expect(resolveDesignFontFace('500')).toEqual({
      fontFamily: appFont.medium,
      fontWeight: '500',
    });
    expect(resolveDesignFontFace('600')).toEqual({
      fontFamily: appFont.semibold,
      fontWeight: '600',
    });
    expect(resolveDesignFontFace('700')).toEqual({
      fontFamily: appFont.bold,
      fontWeight: '700',
    });
  });

  it('preserves monospace', () => {
    expect(resolveAppFontFace('600', 'monospace').fontFamily).toBe('monospace');
  });

  it('preserves IBM Plex families for posts content', () => {
    expect(resolveAppFontFace('400', postsFont.regular)).toEqual({
      fontFamily: postsFont.regular,
      fontWeight: '400',
    });
    expect(resolveAppFontFace('700', postsFont.bold)).toEqual({
      fontFamily: postsFont.bold,
      fontWeight: '700',
    });
  });

  it('resolves posts faces to IBM Plex', () => {
    expect(resolvePostsFontFace('400')).toEqual({
      fontFamily: postsFont.regular,
      fontWeight: '400',
    });
    expect(resolvePostsFontFace('700')).toEqual({
      fontFamily: postsFont.bold,
      fontWeight: '700',
    });
  });
});

describe('typography tokens', () => {
  it('uses the price Bold face for every content token including tabs', () => {
    expect(OFFICIAL_APP_FONT).toBe(appFont.bold);
    expect(typography.valueLarge.fontFamily).toBe(OFFICIAL_APP_FONT);
    expect(typography.feedTitle.fontFamily).toBe(OFFICIAL_APP_FONT);
    expect(typography.feedBody.fontFamily).toBe(OFFICIAL_APP_FONT);
    expect(typography.tab.fontFamily).toBe(OFFICIAL_APP_FONT);
    expect(typography.tabActive.fontFamily).toBe(OFFICIAL_APP_FONT);
    for (const token of Object.values(typography)) {
      const family = (token as { fontFamily?: string }).fontFamily;
      if (!family) continue;
      expect(family).toBe(OFFICIAL_APP_FONT);
    }
  });

  it('keeps size hierarchy while locking the official face', () => {
    expect(typography.display).toMatchObject({ fontSize: 24, fontFamily: OFFICIAL_APP_FONT, lineHeight: 32 });
    expect(typography.body).toMatchObject({ fontSize: 16, fontFamily: OFFICIAL_APP_FONT, lineHeight: 24 });
    expect(typography.feedBody).toMatchObject({ fontSize: 14, fontFamily: OFFICIAL_APP_FONT, lineHeight: 20 });
    expect(typography.tab).toMatchObject({ fontSize: 10, lineHeight: 13 });
  });

  it('registers Tajawal as the app face and IBM Plex for posts', () => {
    expect(APP_FONT_NAME).toBe('Tajawal');
    expect(APP_FONT_FACES).toEqual([
      'Tajawal_400Regular',
      'Tajawal_500Medium',
      'Tajawal_700Bold',
    ]);
    expect(POSTS_FONT_FACES).toEqual([
      'IBMPlexSansArabic_400Regular',
      'IBMPlexSansArabic_500Medium',
      'IBMPlexSansArabic_600SemiBold',
      'IBMPlexSansArabic_700Bold',
    ]);
  });
});

describe('package fonts', () => {
  it('depends on Tajawal for the app and IBM Plex for posts only', () => {
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    expect(deps['@expo-google-fonts/tajawal']).toBeTruthy();
    expect(deps['@expo-google-fonts/ibm-plex-sans-arabic']).toBeTruthy();
  });
});
