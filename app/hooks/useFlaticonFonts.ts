import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  useFonts,
} from '@expo-google-fonts/tajawal';

/** Loads Tajawal Arabic UI font (icons are SVG — no font preload). */
export function useFlaticonFonts() {
  const [loaded, error] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
  });
  return { loaded, error: error ?? null };
}
