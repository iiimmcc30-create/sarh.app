/**
 * Dark-mode luxury palette (Sarh identity).
 * Used by theme.ts — prefer `colors` from useTheme() in components.
 */
export const luxuryDark = {
  bg: '#090909',
  card: '#151515',
  surface: '#1C1C1C',
  border: '#262626',
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#8A8A8A',
  accent: '#69D84F',
  accentSoft: 'rgba(105, 216, 79, 0.14)',
  accentGlow: 'rgba(105, 216, 79, 0.22)',
  radius: 22,
  tabGlass: 'rgba(9, 9, 9, 0.88)',
} as const;

/** @deprecated Use luxuryDark or theme colors */
export const homeLuxury = luxuryDark;
