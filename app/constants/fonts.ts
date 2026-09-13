/**
 * Official Sarh UI typeface = Tajawal.
 *
 * Tajawal_700Bold  is the visual anchor for listing prices and headings.
 * Tajawal_400Regular / 500Medium cover body and label roles.
 * Tajawal has no 600 face — semibold aliases to 700Bold.
 *
 * Phase-2 official scale: `resolveDesignFontFace` maps 400/500/600/700 to
 * distinct Tajawal files. Used by `@/design-system` AppText.
 *
 * `resolveAppFontFace` stays Bold-only so existing screens that still go
 * through `@/components/ui/AppText` and `theme.typography` do not rewrite.
 */
export const APP_FONT_NAME = 'Tajawal' as const;

export const appFont = {
  regular: 'Tajawal_400Regular',
  medium: 'Tajawal_500Medium',
  /** Tajawal has no 600 — aliases to Bold. */
  semibold: 'Tajawal_700Bold',
  /** Official sole content face — same as listing price. */
  bold: 'Tajawal_700Bold',
} as const;

/** The only content fontFamily used across the app (matches price). */
export const OFFICIAL_APP_FONT = appFont.bold;

export type AppFontWeight = '400' | '500' | '600' | '700';

/** Faces that must not be rewritten to Tajawal (icons / card numbers). */
const PRESERVED_FAMILIES = new Set([
  'monospace',
  'FlaticonUicons-RegularRounded',
  'FlaticonUicons-SolidRounded',
  'FlaticonUicons-BoldRounded',
]);

const OFFICIAL_FACE = {
  fontFamily: OFFICIAL_APP_FONT,
  fontWeight: '700' as const,
};

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

/** Map any requested weight → official price Bold face (legacy live UI). */
export function resolveAppFontFace(
  weight?: string | number,
  existingFamily?: string,
): { fontFamily: string; fontWeight: AppFontWeight } {
  if (existingFamily && PRESERVED_FAMILIES.has(existingFamily)) {
    return { fontFamily: existingFamily, fontWeight: '400' };
  }

  // Ignore weight / legacy family names — price Bold only.
  void weight;
  return { ...OFFICIAL_FACE };
}

/**
 * Official design-system face resolver — real Tajawal weights.
 * Do not use from legacy screens that still expect Bold remapping.
 */
export function resolveDesignFontFace(
  weight?: string | number,
  existingFamily?: string,
): { fontFamily: string; fontWeight: AppFontWeight } {
  if (existingFamily && PRESERVED_FAMILIES.has(existingFamily)) {
    return { fontFamily: existingFamily, fontWeight: '400' };
  }

  const fontWeight = normalizeAppFontWeight(weight);
  return { fontFamily: DESIGN_FACES[fontWeight], fontWeight };
}

/** Registered Tajawal faces loaded at boot. */
export const APP_FONT_FACES = [
  appFont.regular,
  appFont.medium,
  appFont.bold,
] as const;
