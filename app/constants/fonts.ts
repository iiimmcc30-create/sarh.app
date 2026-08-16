/**
 * IBM Plex Sans Arabic — same family as FloatingTabBar.
 * Loaded files (via @expo-google-fonts/ibm-plex-sans-arabic):
 *   IBMPlexSansArabic_400Regular (legacy / icon-host fallback only)
 *   IBMPlexSansArabic_500Medium
 *   IBMPlexSansArabic_600SemiBold
 *   IBMPlexSansArabic_700Bold
 * Content typography uses 500 / 600 / 700 only.
 * Bottom-nav labels keep their own tokens (500 / 600) and must not be restyled here.
 */
export const APP_FONT_NAME = 'IBM Plex Sans Arabic' as const;

export const appFont = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

export type AppFontWeight = '400' | '500' | '600' | '700';

const PRESERVED_FAMILIES = new Set([
  'monospace',
  'FlaticonUicons-RegularRounded',
  'FlaticonUicons-SolidRounded',
  'FlaticonUicons-BoldRounded',
]);

/** Map CSS/RN weight → loaded IBM Plex file. Content 100–400 promote to 500. */
export function resolveAppFontFace(
  weight?: string | number,
  existingFamily?: string,
): { fontFamily: string; fontWeight: AppFontWeight } {
  if (existingFamily && PRESERVED_FAMILIES.has(existingFamily)) {
    return { fontFamily: existingFamily, fontWeight: '400' };
  }

  const w = weight == null ? '' : String(weight);
  if (w === '800' || w === '900') {
    return { fontFamily: appFont.bold, fontWeight: '700' };
  }
  if (w === '700' || w === 'bold') {
    return { fontFamily: appFont.bold, fontWeight: '700' };
  }
  if (w === '600' || w === 'semibold') {
    return { fontFamily: appFont.semibold, fontWeight: '600' };
  }
  if (w === '500' || w === 'medium') {
    return { fontFamily: appFont.medium, fontWeight: '500' };
  }
  if (w === '400' || w === 'normal' || w === '100' || w === '200' || w === '300') {
    return { fontFamily: appFont.medium, fontWeight: '500' };
  }

  if (existingFamily === appFont.bold) return { fontFamily: appFont.bold, fontWeight: '700' };
  if (existingFamily === appFont.semibold) return { fontFamily: appFont.semibold, fontWeight: '600' };
  if (existingFamily === appFont.medium) return { fontFamily: appFont.medium, fontWeight: '500' };

  return { fontFamily: appFont.medium, fontWeight: '500' };
}
