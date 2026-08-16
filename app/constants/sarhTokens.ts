/**
 * Sarh Premium Design System — unified visual tokens
 * Background → Surface → Elevated · Accent reserved for actions
 *
 * Light palette lives primarily in `theme.ts` / `designSystem.ts` (`ds.light`).
 * `sarh.color` remains the dark canonical surface set used by many screens.
 */
export const sarh = {
  color: {
    /** Dark Mode — deep cinematic neutrals (not pure black) */
    bg: '#07131C',
    surface: '#0C1C27',
    surfaceRaised: '#102633',
    surfaceAlt: '#142C3A',
    /** Brand accent — existing identity green (do not replace) */
    action: '#20B66F',
    actionPressed: '#18965B',
    actionMuted: 'rgba(32, 182, 111, 0.14)',
    text: '#F4F6F5',
    textSecondary: '#D6DDE0',
    textMuted: '#94A3AC',
    border: '#1B3442',
    pattern: '#1E3A4A',
    fab: '#FFFFFF',
    fabIcon: '#07131C',
    overlay: 'rgba(7, 19, 28, 0.88)',
    danger: '#E85D5D',
    warning: '#D4A017',
    success: '#20B66F',
    /** Light Mode mirrors (for screens that read sarh.color directly) */
    lightBg: '#F5F7F9',
    lightSurface: '#FFFFFF',
    lightElevated: '#FFFFFF',
    lightBorder: '#E6EBEF',
    lightText: '#101820',
    lightTextSecondary: '#65727D',
    lightTextMuted: '#8D99A3',
  },
  /** Spacing grid: 4 / 8 / 12 / 16 / 20 / 24 / 32 */
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  /** Radius scale: 8 / 12 / 16 / 20 */
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    card: 16,
    pill: 999,
    fab: 16,
  },
  pattern: {
    opacity: 0.06,
  },
} as const;

export type SarhTokens = typeof sarh;
