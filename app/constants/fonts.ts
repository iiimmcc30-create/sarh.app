/**
 * Official Sarh UI typeface = listing price face:
 *   IBMPlexSansArabic_700Bold  (IBM Plex Sans Arabic Bold)
 *
 * Price text (`typography.valueLarge`) is the visual reference. Every content
 * face resolves to that same Bold file so the app never mixes Medium/SemiBold
 * letterforms with the price typeface.
 *
 * Still loaded (for legacy name remaps / tooling): Regular / Medium / SemiBold.
 * Tajawal is not used and must not be reintroduced.
 */
export const APP_FONT_NAME = 'IBM Plex Sans Arabic' as const;

export const appFont = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  /** Official sole content face — same as listing price. */
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

/** The only content fontFamily used across the app (matches price). */
export const OFFICIAL_APP_FONT = appFont.bold;

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

const OFFICIAL_FACE = {
  fontFamily: OFFICIAL_APP_FONT,
  fontWeight: '700' as const,
};

/** Map any requested weight → official price Bold face. */
export function resolveAppFontFace(
  weight?: string | number,
  existingFamily?: string,
): { fontFamily: string; fontWeight: AppFontWeight } {
  if (existingFamily && PRESERVED_FAMILIES.has(existingFamily)) {
    return { fontFamily: existingFamily, fontWeight: '400' };
  }

  // Ignore weight / legacy Medium-SemiBold names — price Bold only.
  void weight;
  if (isLegacyTajawalFamily(existingFamily)) {
    return { ...OFFICIAL_FACE };
  }

  return { ...OFFICIAL_FACE };
}

/** Registered IBM Plex Sans Arabic faces loaded at boot. */
export const APP_FONT_FACES = [
  appFont.regular,
  appFont.medium,
  appFont.semibold,
  appFont.bold,
] as const;
