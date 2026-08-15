/**
 * IBM Plex Sans Arabic — same faces as FloatingTabBar (source of truth).
 * Loaded files (via @expo-google-fonts/ibm-plex-sans-arabic):
 *   IBMPlexSansArabic_400Regular
 *   IBMPlexSansArabic_500Medium
 *   IBMPlexSansArabic_600SemiBold
 * No local assets/fonts copies. Do not request 700+ — that file is not loaded.
 */
export const APP_FONT_NAME = 'IBM Plex Sans Arabic' as const;

export const appFont = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  /** Loaded SemiBold file — not a synthetic 700 */
  bold: 'IBMPlexSansArabic_600SemiBold',
  semibold: 'IBMPlexSansArabic_600SemiBold',
} as const;

export type AppFontWeight = '400' | '500' | '600';

const PRESERVED_FAMILIES = new Set([
  'monospace',
  'FlaticonUicons-RegularRounded',
  'FlaticonUicons-SolidRounded',
  'FlaticonUicons-BoldRounded',
]);

/** Map CSS/RN weight → loaded IBM Plex file. Unsupported 700+ clamp to 600 file. */
export function resolveAppFontFace(
  weight?: string | number,
  existingFamily?: string,
): { fontFamily: string; fontWeight: AppFontWeight } {
  if (existingFamily && PRESERVED_FAMILIES.has(existingFamily)) {
    return { fontFamily: existingFamily, fontWeight: '400' };
  }

  const w = weight == null ? '' : String(weight);
  if (w === '700' || w === '800' || w === '900' || w === 'bold') {
    return { fontFamily: appFont.semibold, fontWeight: '600' };
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

  if (existingFamily === appFont.semibold) return { fontFamily: appFont.semibold, fontWeight: '600' };
  if (existingFamily === appFont.medium) return { fontFamily: appFont.medium, fontWeight: '500' };
  if (existingFamily === appFont.regular) return { fontFamily: appFont.regular, fontWeight: '400' };

  return { fontFamily: appFont.regular, fontWeight: '400' };
}
