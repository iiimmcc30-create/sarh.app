import { useState } from 'react';

/** Lucide uses SVG — no font preload required. */
export function useFlaticonFonts() {
  const [loaded] = useState(true);
  return { loaded, error: null as Error | null };
}
