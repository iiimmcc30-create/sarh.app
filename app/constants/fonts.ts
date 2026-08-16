/**
 * IBM Plex Sans Arabic — sole UI typeface (do not replace / add families).
 *
 * Loaded faces:
 *   IBMPlexSansArabic_400Regular
 *   IBMPlexSansArabic_500Medium
 *   IBMPlexSansArabic_600SemiBold
 *   IBMPlexSansArabic_700Bold
 *
 * Content weights map 1:1 to these faces. Bottom-nav `tab` / `tabActive`
 * tokens stay frozen in theme.ts.
 */
export const APP_FONT_NAME = 'IBM Plex Sans Arabic' as const;

export const appFont = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

/** @deprecated Prefer `appFont` + weight roles — kept for call sites. */
export const OFFICIAL_APP_FONT = appFont.bold;

export type AppFontWeight = '400' | '500' | '600' | '700';

const PRESERVED_FAMILIES = new Set([
  'monospace',
  'FlaticonUicons-RegularRounded',
  'FlaticonUicons-SolidRounded',
  'FlaticonUicons-BoldRounded',
]);

function isLegacyTajawalFamily(family?: string): boolean {
  if (!family) return false;
  return /tajawal/i.test(family);
}

function faceForWeight(weight: AppFontWeight): string {
  if (weight === '700') return appFont.bold;
  if (weight === '600') return appFont.semibold;
  if (weight === '400') return appFont.regular;
  return appFont.medium;
}

/** Map CSS/RN weight → loaded IBM Plex face (same family, correct file). */
export function resolveAppFontFace(
  weight?: string | number,
  existingFamily?: string,
): { fontFamily: string; fontWeight: AppFontWeight } {
  if (existingFamily && PRESERVED_FAMILIES.has(existingFamily)) {
    return { fontFamily: existingFamily, fontWeight: '400' };
  }

  const w = weight == null ? '' : String(weight);
  if (w === '800' || w === '900' || w === '700' || w === 'bold') {
    return { fontFamily: appFont.bold, fontWeight: '700' };
  }
  if (w === '600' || w === 'semibold') {
    return { fontFamily: appFont.semibold, fontWeight: '600' };
  }
  if (w === '500' || w === 'medium') {
    return { fontFamily: appFont.medium, fontWeight: '500' };
  }
  if (w === '400' || w === 'normal' || w === '100' || w === '200' || w === '300') {
    return { fontFamily: appFont.regular, fontWeight: '400' };
  }

  if (existingFamily === appFont.bold) return { fontFamily: appFont.bold, fontWeight: '700' };
  if (existingFamily === appFont.semibold) return { fontFamily: appFont.semibold, fontWeight: '600' };
  if (existingFamily === appFont.medium) return { fontFamily: appFont.medium, fontWeight: '500' };
  if (existingFamily === appFont.regular) return { fontFamily: appFont.regular, fontWeight: '400' };

  if (!existingFamily || existingFamily === APP_FONT_NAME || isLegacyTajawalFamily(existingFamily)) {
    return { fontFamily: appFont.medium, fontWeight: '500' };
  }

  return { fontFamily: faceForWeight('500'), fontWeight: '500' };
}

/** Style helper for theme tokens — IBM Plex face + matching weight. */
export function typeFace(weight: AppFontWeight): {
  fontFamily: string;
  fontWeight: AppFontWeight;
} {
  return { fontFamily: faceForWeight(weight), fontWeight: weight };
}

export const APP_FONT_FACES = [
  appFont.regular,
  appFont.medium,
  appFont.semibold,
  appFont.bold,
] as const;
