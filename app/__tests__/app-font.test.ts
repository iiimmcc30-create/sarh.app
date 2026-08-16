import {
  appFont,
  APP_FONT_FACES,
  APP_FONT_NAME,
  resolveAppFontFace,
  typeFace,
} from '@/constants/fonts';
import { typography } from '@/constants/theme';
import packageJson from '../package.json';

describe('resolveAppFontFace', () => {
  it('maps weights to IBM Plex Sans Arabic faces', () => {
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
  });

  it('preserves monospace', () => {
    expect(resolveAppFontFace('600', 'monospace').fontFamily).toBe('monospace');
  });

  it('remaps legacy Tajawal names into IBM Plex by weight', () => {
    expect(resolveAppFontFace('700', 'Tajawal_700Bold')).toEqual({
      fontFamily: appFont.bold,
      fontWeight: '700',
    });
    expect(resolveAppFontFace('400', 'Tajawal-Regular')).toEqual({
      fontFamily: appFont.regular,
      fontWeight: '400',
    });
  });
});

describe('unified typography roles', () => {
  it('keeps IBM Plex Sans Arabic as the only content family', () => {
    expect(APP_FONT_NAME).toBe('IBM Plex Sans Arabic');
    for (const token of Object.values(typography)) {
      const family = (token as { fontFamily?: string }).fontFamily;
      if (!family) continue;
      expect(family.startsWith('IBMPlexSansArabic_')).toBe(true);
    }
  });

  it('matches the unified size / line-height scale', () => {
    expect(typography.display).toMatchObject({ fontSize: 32, lineHeight: 40, fontWeight: '700' });
    expect(typography.pageTitle).toMatchObject({ fontSize: 24, lineHeight: 32, fontWeight: '700' });
    expect(typography.sectionHeadingLarge).toMatchObject({ fontSize: 22, lineHeight: 30, fontWeight: '700' });
    expect(typography.sectionHeading).toMatchObject({ fontSize: 20, lineHeight: 28, fontWeight: '700' });
    expect(typography.subsection).toMatchObject({ fontSize: 18, lineHeight: 26, fontWeight: '600' });
    expect(typography.cardHeading).toMatchObject({ fontSize: 17, lineHeight: 24, fontWeight: '600' });
    expect(typography.bodyLarge).toMatchObject({ fontSize: 16, lineHeight: 24, fontWeight: '500' });
    expect(typography.bodyMedium).toMatchObject({ fontSize: 16, lineHeight: 24, fontWeight: '500' });
    expect(typography.body).toMatchObject({ fontSize: 15, lineHeight: 22, fontWeight: '400' });
    expect(typography.bodySmall).toMatchObject({ fontSize: 14, lineHeight: 20, fontWeight: '400' });
    expect(typography.label).toMatchObject({ fontSize: 14, lineHeight: 20, fontWeight: '500' });
    expect(typography.caption).toMatchObject({ fontSize: 12, lineHeight: 16, fontWeight: '400' });
    expect(typography.button).toMatchObject({ fontSize: 15, lineHeight: 20, fontWeight: '600' });
    expect(typography.buttonSmall).toMatchObject({ fontSize: 13, lineHeight: 18, fontWeight: '600' });
    expect(typography.priceLarge).toMatchObject({ fontSize: 24, lineHeight: 32, fontWeight: '700' });
    expect(typography.price).toMatchObject({ fontSize: 20, lineHeight: 28, fontWeight: '700' });
    expect(typography.priceSmall).toMatchObject({ fontSize: 18, lineHeight: 24, fontWeight: '700' });
    expect(typography.tabs).toMatchObject({ fontSize: 14, lineHeight: 20, fontWeight: '500' });
    expect(typography.chip).toMatchObject({ fontSize: 13, lineHeight: 18, fontWeight: '500' });
    expect(typography.badge).toMatchObject({ fontSize: 12, lineHeight: 16, fontWeight: '600' });
  });

  it('freezes bottom-nav tab tokens', () => {
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

  it('registers the four supported IBM Plex weights', () => {
    expect(APP_FONT_FACES).toEqual([
      'IBMPlexSansArabic_400Regular',
      'IBMPlexSansArabic_500Medium',
      'IBMPlexSansArabic_600SemiBold',
      'IBMPlexSansArabic_700Bold',
    ]);
    expect(typeFace('400').fontFamily).toBe(appFont.regular);
    expect(typeFace('700').fontFamily).toBe(appFont.bold);
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
