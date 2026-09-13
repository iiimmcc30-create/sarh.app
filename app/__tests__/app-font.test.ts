import {
  appFont,
  APP_FONT_FACES,
  APP_FONT_NAME,
  OFFICIAL_APP_FONT,
  resolveAppFontFace,
  resolveDesignFontFace,
} from '@/constants/fonts';
import { typography } from '@/constants/theme';
import packageJson from '../package.json';

describe('resolveAppFontFace', () => {
  it('always resolves content text to the official price Bold face', () => {
    expect(resolveAppFontFace('500')).toEqual({
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
    });
    expect(resolveAppFontFace('600')).toEqual({
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
    });
    expect(resolveAppFontFace('700')).toEqual({
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
    });
    expect(resolveAppFontFace('400')).toEqual({
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
    });
    expect(resolveAppFontFace('normal', appFont.medium)).toEqual({
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
    });
  });

  it('keeps a separate design-system resolver with real weights', () => {
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

  it('always returns the official Bold face regardless of incoming family', () => {
    expect(resolveAppFontFace('700', 'Tajawal_700Bold')).toEqual({
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
    });
    expect(resolveAppFontFace(undefined, 'Tajawal_400Regular')).toEqual({
      fontFamily: OFFICIAL_APP_FONT,
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

  it('registers Tajawal faces', () => {
    expect(APP_FONT_NAME).toBe('Tajawal');
    expect(APP_FONT_FACES).toEqual([
      'Tajawal_400Regular',
      'Tajawal_500Medium',
      'Tajawal_700Bold',
    ]);
  });
});

describe('package fonts', () => {
  it('depends on Tajawal and not on IBM Plex Sans Arabic', () => {
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    expect(deps['@expo-google-fonts/tajawal']).toBeTruthy();
    expect(Object.keys(deps).some((k) => /ibm-plex/i.test(k))).toBe(false);
  });
});
