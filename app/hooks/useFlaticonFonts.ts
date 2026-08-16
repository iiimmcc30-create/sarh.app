import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans-arabic';

/**
 * Loads the sole app typeface: IBM Plex Sans Arabic (400 / 500 / 600 / 700).
 * Icons are SVG — no Flaticon font preload.
 */
export function useFlaticonFonts() {
  const [loaded, error] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });
  return { loaded, error: error ?? null };
}
