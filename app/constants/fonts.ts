/**
 * IBM Plex Sans Arabic — sole UI typeface for the Sarh Expo app.
 *
 * Loaded via `@expo-google-fonts/ibm-plex-sans-arabic` in `useFlaticonFonts`
 * and applied globally through `applyAppFonts()` after boot.
 *
 * Registered faces:
 *   IBMPlexSansArabic_400Regular
 *   IBMPlexSansArabic_500Medium
 *   IBMPlexSansArabic_600SemiBold
 *   IBMPlexSansArabic_700Bold
 *
 * Content typography tokens use 500 / 600 / 700 (Regular/400 promotes to Medium
 * so body copy matches the established visual hierarchy). Bottom-nav `tab` /
 * `tabActive` tokens stay frozen.
 *
 * Tajawal is not used and must not be reintroduced.
 */
export const APP_FONT_NAME = 'IBM Plex Sans Arabic' as const;

export const appFont = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

export type AppFontWeight = '400' | '500' | '600' | '700';

/** Faces that must not be rewritten to IBM Plex (icons / card numbers). */
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

  // Explicit IBM Plex face names (or legacy Tajawal remapped by weight above).
  if (existingFamily === appFont.bold) return { fontFamily: appFont.bold, fontWeight: '700' };
  if (existingFamily === appFont.semibold) return { fontFamily: appFont.semibold, fontWeight: '600' };
  if (existingFamily === appFont.medium) return { fontFamily: appFont.medium, fontWeight: '500' };
  if (existingFamily === appFont.regular) return { fontFamily: appFont.medium, fontWeight: '500' };

  // Display name or any leftover Tajawal family → Medium content default.
  if (
    !existingFamily ||
    existingFamily === APP_FONT_NAME ||
    isLegacyTajawalFamily(existingFamily)
  ) {
    return { fontFamily: appFont.medium, fontWeight: '500' };
  }

  return { fontFamily: appFont.medium, fontWeight: '500' };
}

/** Registered IBM Plex Sans Arabic faces loaded at boot. */
export const APP_FONT_FACES = [
  appFont.regular,
  appFont.medium,
  appFont.semibold,
  appFont.bold,
] as const;
