import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans-arabic';

/** Loads IBM Plex Sans Arabic (icons are SVG — no font preload). */
export function useFlaticonFonts() {
  const [loaded, error] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
  });
  return { loaded, error: error ?? null };
}
