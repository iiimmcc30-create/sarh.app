import { appFont, APP_FONT_FACES, APP_FONT_NAME, resolveAppFontFace } from '@/constants/fonts';
import { typography } from '@/constants/theme';
import packageJson from '../package.json';

describe('resolveAppFontFace', () => {
  it('maps content weights to loaded IBM Plex files', () => {
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
  });

  it('promotes Regular / 400 to Medium 500 for content', () => {
    expect(resolveAppFontFace('400')).toEqual({
      fontFamily: appFont.medium,
      fontWeight: '500',
    });
    expect(resolveAppFontFace('normal', appFont.regular)).toEqual({
      fontFamily: appFont.medium,
      fontWeight: '500',
    });
  });

  it('does not keep Regular file when weight is 600', () => {
    expect(resolveAppFontFace('600', appFont.regular)).toEqual({
      fontFamily: appFont.semibold,
      fontWeight: '600',
    });
  });

  it('clamps 800+ to the loaded 700 file', () => {
    expect(resolveAppFontFace('800')).toEqual({
      fontFamily: appFont.bold,
      fontWeight: '700',
    });
    expect(resolveAppFontFace('bold')).toEqual({
      fontFamily: appFont.bold,
      fontWeight: '700',
    });
  });

  it('preserves monospace', () => {
    expect(resolveAppFontFace('600', 'monospace').fontFamily).toBe('monospace');
  });

  it('remaps legacy Tajawal family names to IBM Plex', () => {
    expect(resolveAppFontFace('700', 'Tajawal_700Bold')).toEqual({
      fontFamily: appFont.bold,
      fontWeight: '700',
    });
    expect(resolveAppFontFace(undefined, 'Tajawal-Regular')).toEqual({
      fontFamily: appFont.medium,
      fontWeight: '500',
    });
  });
});

describe('typography tokens', () => {
  it('keeps bottom-nav tab tokens frozen', () => {
    expect(typography.tab).toMatchObject({
      fontFamily: appFont.medium,
      fontWeight: '500',
      fontSize: 10,
      lineHeight: 13,
    });
    expect(typography.tabActive).toMatchObject({
      fontFamily: appFont.semibold,
      fontWeight: '600',
      fontSize: 10,
      lineHeight: 13,
    });
  });

  it('exposes the content scale', () => {
    expect(typography.display).toMatchObject({ fontSize: 24, fontWeight: '700', lineHeight: 32 });
    expect(typography.sectionHeading).toMatchObject({ fontSize: 20, fontWeight: '700', lineHeight: 28 });
    expect(typography.cardHeadingLarge).toMatchObject({ fontSize: 18, fontWeight: '600', lineHeight: 26 });
    expect(typography.cardHeading).toMatchObject({ fontSize: 16, fontWeight: '600', lineHeight: 24 });
    expect(typography.body).toMatchObject({ fontSize: 16, fontWeight: '500', lineHeight: 24 });
    expect(typography.button).toMatchObject({ fontSize: 15, fontWeight: '600', lineHeight: 20 });
    expect(typography.caption).toMatchObject({ fontSize: 12, fontWeight: '500', lineHeight: 18 });
    expect(typography.badge).toMatchObject({ fontSize: 12, fontWeight: '600', lineHeight: 18 });
  });

  it('uses only IBM Plex Sans Arabic for content faces', () => {
    expect(APP_FONT_NAME).toBe('IBM Plex Sans Arabic');
    expect(APP_FONT_FACES).toEqual([
      'IBMPlexSansArabic_400Regular',
      'IBMPlexSansArabic_500Medium',
      'IBMPlexSansArabic_600SemiBold',
      'IBMPlexSansArabic_700Bold',
    ]);
    for (const token of Object.values(typography)) {
      const family = (token as { fontFamily?: string }).fontFamily;
      if (!family) continue;
      expect(family.startsWith('IBMPlexSansArabic_')).toBe(true);
    }
  });
});

describe('package fonts', () => {
  it('does not depend on Tajawal', () => {
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    expect(Object.keys(deps).some((name) => /tajawal/i.test(name))).toBe(false);
    expect(deps['@expo-google-fonts/ibm-plex-sans-arabic']).toBeTruthy();
  });
});
