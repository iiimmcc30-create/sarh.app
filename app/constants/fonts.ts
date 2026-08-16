/**
 * IBM Plex Sans Arabic — sole UI typeface for the Sarh Expo app.
 *
 * Loaded via `@expo-google-fonts/ibm-plex-sans-arabic` in `useFlaticonFonts`
 * and applied globally through `applyAppFonts()` after boot.
 *
 * Registered faces (official price text uses Bold — same family everywhere):
 *   IBMPlexSansArabic_400Regular
 *   IBMPlexSansArabic_500Medium
 *   IBMPlexSansArabic_600SemiBold
 *   IBMPlexSansArabic_700Bold
 *
 * Content typography tokens use 500 / 600 / 700 (Regular/400 promotes to Medium
 * so body copy matches the established visual hierarchy). Bottom-nav `tab` /
 * `tabActive` tokens stay frozen.
 *
 * Android: each TTF already encodes its weight. Passing fontWeight alongside
 * the face name makes Android fall back to the system Arabic typeface (looks
 * like a different font). Use `typeFace()` / `toNativeFontStyle()` so Android
 * keeps `fontWeight: 'normal'` while selecting the correct face file.
 *
 * Tajawal is not used and must not be reintroduced.
 */
import { Platform, type TextStyle } from 'react-native';

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

function familyForWeight(weight: AppFontWeight): string {
  if (weight === '700') return appFont.bold;
  if (weight === '600') return appFont.semibold;
  if (weight === '400') return appFont.regular;
  return appFont.medium;
}

/**
 * Platform-safe IBM Plex face style for StyleSheets / components.
 * Preserves visual weight via the correct TTF; avoids Android system fallback.
 */
export function typeFace(weight: AppFontWeight): TextStyle {
  return toNativeFontStyle({
    fontFamily: familyForWeight(weight),
    fontWeight: weight,
  });
}

/** Apply Android-safe fontWeight while keeping the selected IBM Plex face. */
export function toNativeFontStyle(face: {
  fontFamily: string;
  fontWeight: AppFontWeight | 'normal';
}): TextStyle {
  if (PRESERVED_FAMILIES.has(face.fontFamily)) {
    return { fontFamily: face.fontFamily, fontWeight: '400' };
  }
  if (Platform.OS === 'android') {
    return { fontFamily: face.fontFamily, fontWeight: 'normal' };
  }
  return { fontFamily: face.fontFamily, fontWeight: face.fontWeight };
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
    // Existing explicit IBM face name wins for Android-safe "normal" remounts.
    if (existingFamily === appFont.bold) return { fontFamily: appFont.bold, fontWeight: '700' };
    if (existingFamily === appFont.semibold) return { fontFamily: appFont.semibold, fontWeight: '600' };
    if (existingFamily === appFont.medium) return { fontFamily: appFont.medium, fontWeight: '500' };
    if (existingFamily === appFont.regular) return { fontFamily: appFont.medium, fontWeight: '500' };
    return { fontFamily: appFont.medium, fontWeight: '500' };
  }

  if (existingFamily === appFont.bold) return { fontFamily: appFont.bold, fontWeight: '700' };
  if (existingFamily === appFont.semibold) return { fontFamily: appFont.semibold, fontWeight: '600' };
  if (existingFamily === appFont.medium) return { fontFamily: appFont.medium, fontWeight: '500' };
  if (existingFamily === appFont.regular) return { fontFamily: appFont.medium, fontWeight: '500' };

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
