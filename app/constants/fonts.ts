/**
 * Official Sarh UI typeface = Tajawal.
 *
 * Tajawal_700Bold is the visual anchor for listing prices and headings.
 * Tajawal_400Regular / 500Medium cover body and label roles.
 * Tajawal has no 600 face — semibold aliases to 700Bold.
 *
 * Phase-2 official scale: `resolveDesignFontFace` maps 400/500/600/700 to
 * Tajawal files. Used by `@/design-system` AppText.
 *
 * `resolveAppFontFace` is weight-aware (does not force Bold). It preserves
 * Flaticon / monospace faces and IBM Plex faces used by post content only.
 *
 * Posts (`PostItem`) keep IBM Plex Sans Arabic — not the app-wide Tajawal face.
 *
 * Android: always apply via `toLoadedFontStyle` — setting numeric fontWeight
 * together with a face-specific family (e.g. Tajawal_700Bold) makes Android
 * fall back to the system font.
 */
import { Platform, type TextStyle } from 'react-native';

export const APP_FONT_NAME = 'Tajawal' as const;

export const appFont = {
  regular: 'Tajawal_400Regular',
  medium: 'Tajawal_500Medium',
  /** Tajawal has no 600 — aliases to Bold. */
  semibold: 'Tajawal_700Bold',
  /** Official listing-price / emphasis face. */
  bold: 'Tajawal_700Bold',
} as const;

/** Default emphasis face for legacy paths that still pin a single family. */
export const OFFICIAL_APP_FONT = appFont.bold;

/**
 * Post feed / PostItem content face — IBM Plex Sans Arabic only.
 * Must stay loaded and must not be remapped to Tajawal by applyAppFonts.
 */
export const POSTS_FONT_NAME = 'IBM Plex Sans Arabic' as const;

export const postsFont = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

export type AppFontWeight = '400' | '500' | '600' | '700';

/** Faces that must not be rewritten (icons / card numbers). */
const PRESERVED_FAMILIES = new Set([
  'monospace',
  'FlaticonUicons-RegularRounded',
  'FlaticonUicons-SolidRounded',
  'FlaticonUicons-BoldRounded',
]);

function normalizeAppFontWeight(weight?: string | number): AppFontWeight {
  const value = String(weight ?? '400').toLowerCase();
  if (value === '700' || value === 'bold') return '700';
  if (value === '600' || value === 'semibold' || value === 'semi-bold') return '600';
  if (value === '500' || value === 'medium') return '500';
  return '400';
}

const DESIGN_FACES: Record<AppFontWeight, string> = {
  '400': appFont.regular,
  '500': appFont.medium,
  '600': appFont.semibold,
  '700': appFont.bold,
};

const POSTS_FACES: Record<AppFontWeight, string> = {
  '400': postsFont.regular,
  '500': postsFont.medium,
  '600': postsFont.semibold,
  '700': postsFont.bold,
};

export function isPostsFontFamily(family?: string): boolean {
  if (!family) return false;
  return /IBMPlexSansArabic/i.test(family);
}

/**
 * Weight-aware app face resolver for live Text patching / legacy AppText.
 * Preserves icon faces and post (IBM Plex) families; maps other text to Tajawal.
 */
export function resolveAppFontFace(
  weight?: string | number,
  existingFamily?: string,
): { fontFamily: string; fontWeight: AppFontWeight } {
  if (existingFamily && PRESERVED_FAMILIES.has(existingFamily)) {
    return { fontFamily: existingFamily, fontWeight: '400' };
  }

  const fontWeight = normalizeAppFontWeight(weight);

  if (isPostsFontFamily(existingFamily)) {
    return {
      fontFamily: existingFamily ?? POSTS_FACES[fontWeight],
      fontWeight,
    };
  }

  return { fontFamily: DESIGN_FACES[fontWeight], fontWeight };
}

/**
 * Official design-system face resolver — Tajawal weights for app UI.
 * Do not use for PostItem (use `resolvePostsFontFace`).
 */
export function resolveDesignFontFace(
  weight?: string | number,
  existingFamily?: string,
): { fontFamily: string; fontWeight: AppFontWeight } {
  if (existingFamily && PRESERVED_FAMILIES.has(existingFamily)) {
    return { fontFamily: existingFamily, fontWeight: '400' };
  }
  if (isPostsFontFamily(existingFamily)) {
    const fontWeight = normalizeAppFontWeight(weight);
    return { fontFamily: existingFamily ?? POSTS_FACES[fontWeight], fontWeight };
  }

  const fontWeight = normalizeAppFontWeight(weight);
  return { fontFamily: DESIGN_FACES[fontWeight], fontWeight };
}

/** Pin post content styles to IBM Plex while the rest of the app uses Tajawal. */
export function resolvePostsFontFace(
  weight?: string | number,
): { fontFamily: string; fontWeight: AppFontWeight } {
  const fontWeight = normalizeAppFontWeight(weight);
  return { fontFamily: POSTS_FACES[fontWeight], fontWeight };
}

/**
 * Style patch for a resolved face. On Android, omit numeric fontWeight so the
 * loaded face file is used (otherwise RN falls back to the system typeface).
 */
export function toLoadedFontStyle(face: {
  fontFamily: string;
  fontWeight: AppFontWeight;
}): TextStyle {
  if (face.fontFamily === 'monospace' || PRESERVED_FAMILIES.has(face.fontFamily)) {
    return { fontFamily: face.fontFamily };
  }
  if (Platform.OS === 'android') {
    return { fontFamily: face.fontFamily, fontWeight: 'normal' };
  }
  return { fontFamily: face.fontFamily, fontWeight: face.fontWeight };
}

/** Registered Tajawal faces loaded for app-wide UI. */
export const APP_FONT_FACES = [
  appFont.regular,
  appFont.medium,
  appFont.bold,
] as const;

/** IBM Plex faces kept loaded for PostItem / posts feed only. */
export const POSTS_FONT_FACES = [
  postsFont.regular,
  postsFont.medium,
  postsFont.semibold,
  postsFont.bold,
] as const;
