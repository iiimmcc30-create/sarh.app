import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  useFonts,
} from '@expo-google-fonts/tajawal';

/**
 * Loads the sole app typeface: Tajawal (400 / 500 / 700).
 * Icons are SVG — no Flaticon font preload.
 */
export function useFlaticonFonts() {
  const [loaded, error] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
  });
  return { loaded, error: error ?? null };
}
