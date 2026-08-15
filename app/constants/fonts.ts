/** IBM Plex Sans Arabic — unified app typeface (400 / 500 / 600). Same family as FloatingTabBar. */
export const APP_FONT_NAME = 'IBM Plex Sans Arabic' as const;

export const appFont = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  /** Use SemiBold for titles — avoid heavy 700 */
  bold: 'IBMPlexSansArabic_600SemiBold',
  semibold: 'IBMPlexSansArabic_600SemiBold',
} as const;
