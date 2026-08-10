// SAFAT — Logo-aligned brand theme (forest green · white · black)
// Supports dark + light palettes; apply via bootstrap before app modules load.

import { luxuryDark } from './homeLuxury';
import { sarh } from './sarhTokens';
import { appFont } from './fonts';

export type ColorScheme = 'light' | 'dark';

export type ThemeColors = {
  bgDeep: string;
  bgPrimary: string;
  bgSurface: string;
  bgElevated: string;
  bgGlass: string;
  bgGlassStrong: string;
  bgOverlay: string;
  royal: string;
  royalDeep: string;
  electric: string;
  electricBright: string;
  glow: string;
  cyan: string;
  silver: string;
  silverBright: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;
  /** Accent text — white in dark mode, brand green in light */
  textBrand: string;
  textBrandStrong: string;
  textBrandSoft: string;
  textBrandAlt: string;
  textBrandSuccess: string;
  gold: string;
  emerald: string;
  rose: string;
  amber: string;
  borderSoft: string;
  borderMid: string;
  borderStrong: string;
  borderHairline: string;
  success: string;
  danger: string;
  warning: string;
  liveRed: string;
  /** Screen page bg — transparent in dark (pattern layer), bgDeep in light */
  screenRoot: string;
};

type BaseThemeColors = Omit<
  ThemeColors,
  | 'textBrand'
  | 'textBrandStrong'
  | 'textBrandSoft'
  | 'textBrandAlt'
  | 'textBrandSuccess'
  | 'screenRoot'
>;

export type ThemeGradients = {
  hero: readonly [string, string, string];
  royal: readonly [string, string, string];
  glass: readonly [string, string];
  liveOverlay: readonly [string, string, string];
  card: readonly [string, string];
  cardHover: readonly [string, string];
  goldRing: readonly [string, string, string];
  electric: readonly [string, string, string];
  primary: readonly [string, string, string];
  rim: readonly [string, string];
};

const sharedAccents = {
  gold: '#F5C56A',
  emerald: '#10B981',
  rose: '#F43F5E',
  amber: '#FBBF24',
  success: '#10B981',
  danger: '#F43F5E',
  warning: '#FBBF24',
  liveRed: '#EF4444',
};

const darkColors: BaseThemeColors = {
  bgDeep: luxuryDark.bg,
  bgPrimary: luxuryDark.bg,
  bgSurface: luxuryDark.card,
  bgElevated: luxuryDark.surface,
  bgGlass: luxuryDark.tabGlass,
  bgGlassStrong: 'rgba(11, 22, 34, 0.95)',
  bgOverlay: 'rgba(11, 22, 34, 0.78)',
  royal: luxuryDark.surfaceAlt,
  royalDeep: luxuryDark.bg,
  electric: luxuryDark.accent,
  electricBright: luxuryDark.accentPressed,
  glow: luxuryDark.accent,
  cyan: luxuryDark.accent,
  silver: luxuryDark.textSecondary,
  silverBright: luxuryDark.textPrimary,
  textPrimary: luxuryDark.textPrimary,
  textSecondary: luxuryDark.textSecondary,
  textMuted: luxuryDark.textMuted,
  textSubtle: luxuryDark.textMuted,
  borderSoft: luxuryDark.border,
  borderMid: luxuryDark.border,
  borderStrong: 'rgba(150, 175, 185, 0.32)',
  borderHairline: luxuryDark.border,
  ...sharedAccents,
};

const lightColors: BaseThemeColors = {
  bgDeep: '#FAFBF8',
  bgPrimary: '#FAFBF8',
  bgSurface: '#FFFFFF',
  bgElevated: '#FFFFFF',
  bgGlass: 'rgba(255, 255, 255, 0.88)',
  bgGlassStrong: 'rgba(255, 255, 255, 0.94)',
  bgOverlay: 'rgba(0, 0, 0, 0.45)',
  royal: '#E8F5EF',
  royalDeep: '#D4EDE0',
  electric: '#0B6B3A',
  electricBright: '#0B6B3A',
  glow: '#0D7A44',
  cyan: '#10B981',
  silver: '#374151',
  silverBright: '#1F2937',
  textPrimary: '#0A0F0C',
  textSecondary: '#3D4A42',
  textMuted: '#6B7A72',
  textSubtle: '#9CA8A0',
  borderSoft: 'rgba(0, 0, 0, 0.06)',
  borderMid: 'rgba(11, 107, 58, 0.14)',
  borderStrong: 'rgba(11, 107, 58, 0.32)',
  borderHairline: 'rgba(0, 0, 0, 0.06)',
  ...sharedAccents,
};

const darkGradients: ThemeGradients = {
  hero: [luxuryDark.bg, luxuryDark.bg, luxuryDark.card],
  royal: [luxuryDark.bg, luxuryDark.surface, luxuryDark.surfaceAlt],
  glass: [luxuryDark.tabGlass, luxuryDark.bg],
  liveOverlay: ['transparent', 'rgba(11,22,34,0.45)', 'rgba(11,22,34,0.96)'],
  card: [luxuryDark.card, luxuryDark.card],
  cardHover: [luxuryDark.surface, luxuryDark.card],
  goldRing: ['#F5C56A', '#FBBF24', '#F5C56A'],
  electric: [luxuryDark.accent, luxuryDark.accent, luxuryDark.accent],
  primary: [luxuryDark.accent, luxuryDark.accentPressed, luxuryDark.surface],
  rim: ['rgba(150,175,185,0.12)', 'rgba(150,175,185,0)'],
};

const lightGradients: ThemeGradients = {
  hero: ['#FAFBF8', '#F5F8F5', '#FFFFFF'],
  royal: ['#E8F5EF', '#D4EDE0', '#0B6B3A'],
  glass: ['rgba(255,255,255,0.95)', 'rgba(250,251,248,0.88)'],
  liveOverlay: ['transparent', 'rgba(255,255,255,0.35)', 'rgba(250,251,248,0.96)'],
  card: ['#FFFFFF', '#F8FAF7'],
  cardHover: ['#FFFFFF', '#F0F4F2'],
  goldRing: ['#F5C56A', '#FBBF24', '#F5C56A'],
  electric: ['#0B6B3A', '#0D7A44', '#10B981'],
  primary: ['#0D7A44', '#0B6B3A', '#E8F5EF'],
  rim: ['rgba(11,107,58,0.2)', 'rgba(11,107,58,0)'],
};

export function createShadow(palette: BaseThemeColors) {
  const isLight = palette === lightColors;
  return {
    glow: {
      shadowColor: palette.glow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isLight ? 0.2 : 0.32,
      shadowRadius: 12,
      elevation: 6,
    },
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isLight ? 0.04 : 0.12,
      shadowRadius: isLight ? 8 : 6,
      elevation: 2,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: isLight ? 6 : 2 },
      shadowOpacity: isLight ? 0.06 : 0.12,
      shadowRadius: isLight ? 14 : 6,
      elevation: isLight ? 5 : 2,
    },
    pressed: {
      shadowColor: palette.electric,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
  };
}

let activeScheme: ColorScheme = 'light';

export const colors = {} as ThemeColors;
export const gradients: ThemeGradients = { ...darkGradients };
export const shadow = createShadow(darkColors);

export function getActiveScheme(): ColorScheme {
  return activeScheme;
}

function enrichTextColors(palette: BaseThemeColors, scheme: ColorScheme): ThemeColors {
  // Dark: white/gray for all readable text — green is actions-only.
  if (scheme === 'dark') {
    return {
      ...palette,
      screenRoot: 'transparent',
      textBrand: palette.textPrimary,
      textBrandStrong: palette.textPrimary,
      textBrandSoft: palette.textSecondary,
      textBrandAlt: palette.textSecondary,
      textBrandSuccess: palette.textPrimary,
    };
  }
  const accent = palette.electric;
  return {
    ...palette,
    screenRoot: palette.bgDeep,
    textBrand: palette.glow,
    textBrandStrong: palette.electricBright,
    textBrandSoft: palette.textSecondary,
    textBrandAlt: palette.electric,
    textBrandSuccess: palette.success,
  };
}

export function applyThemeScheme(scheme: ColorScheme) {
  activeScheme = scheme;
  const palette = scheme === 'dark' ? darkColors : lightColors;
  const paletteGradients = scheme === 'dark' ? darkGradients : lightGradients;
  Object.assign(colors, enrichTextColors(palette, scheme));
  Object.assign(gradients, paletteGradients);
  Object.assign(shadow, createShadow(palette));
}

/** Gradients that must react to light/dark at runtime (not frozen in StyleSheet). */
export function headerFadeGradient(scheme: ColorScheme): readonly [string, string] {
  return scheme === 'light'
    ? ['rgba(250, 251, 248, 0.98)', 'rgba(250, 251, 248, 0)']
    : ['rgba(11, 22, 34, 0.98)', 'rgba(11, 22, 34, 0)'];
}

export function imageCardOverlay(scheme: ColorScheme): readonly [string, string] {
  return scheme === 'light'
    ? ['transparent', 'rgba(15, 23, 42, 0.72)']
    : ['transparent', 'rgba(0, 0, 0, 0.92)'];
}

export function imageCardOverlayStrong(scheme: ColorScheme): readonly [string, string] {
  return scheme === 'light'
    ? ['transparent', 'rgba(15, 23, 42, 0.82)']
    : ['transparent', 'rgba(0, 0, 0, 0.95)'];
}

export function scrimColor(scheme: ColorScheme, opacity = 0.85): string {
  return scheme === 'light'
    ? `rgba(250, 251, 248, ${opacity})`
    : `rgba(11, 22, 34, ${opacity})`;
}

/** Raised panel surface — darker gray in dark mode, softer tint in light (sidebar, posts, etc.). */
export function panelSurfaceBg(scheme: ColorScheme, palette: ThemeColors): string {
  return scheme === 'dark' ? palette.bgElevated : palette.bgSurface;
}

applyThemeScheme(activeScheme);

export const spacing = {
  xs: sarh.space.xs,
  sm: sarh.space.sm,
  md: sarh.space.md,
  lg: sarh.space.lg,
  xl: sarh.space.xl,
  xxl: sarh.space.xxl,
  xxxl: sarh.space.xxxl,
  huge: 48,
};

export const radius = {
  sm: sarh.radius.sm,
  md: sarh.radius.md,
  lg: sarh.radius.lg,
  xl: sarh.radius.xl,
  xxl: 28,
  pill: sarh.radius.pill,
};

/** Text direction follows I18nManager — no hardcoded textAlign (avoids RTL mirror bugs). */
const directionalText = {
  writingDirection: 'rtl' as const,
};

export const typography = {
  display: { fontSize: 36, fontFamily: appFont.bold, fontWeight: '700' as const, letterSpacing: -0.6, ...directionalText },
  h1: { fontSize: 28, fontFamily: appFont.bold, fontWeight: '700' as const, letterSpacing: -0.4, ...directionalText },
  h2: { fontSize: 24, fontFamily: appFont.bold, fontWeight: '700' as const, ...directionalText },
  h3: { fontSize: 20, fontFamily: appFont.medium, fontWeight: '600' as const, ...directionalText },
  body: { fontSize: 15, fontFamily: appFont.regular, fontWeight: '400' as const, ...directionalText },
  bodyStrong: { fontSize: 15, fontFamily: appFont.medium, fontWeight: '600' as const, ...directionalText },
  caption: { fontSize: 13, fontFamily: appFont.medium, fontWeight: '500' as const, ...directionalText },
  micro: { fontSize: 11, fontFamily: appFont.medium, fontWeight: '600' as const, letterSpacing: 0.3, ...directionalText },
};

/** Shared 2026 layout metrics. Keep screens visually consistent across device sizes. */
export const layout = {
  screenPadding: spacing.lg,
  sectionGap: spacing.xxl,
  contentMaxWidth: 720,
  headerHeight: 60,
  tabBarHeight: 64,
};

export const controls = {
  heightSm: 40,
  heightMd: 48,
  heightLg: 52,
  iconButton: 40,
  minTouchTarget: 44,
};

/**
 * Shared app chrome, sourced from the current login screen.
 * Keeps cards, fields, and primary actions visually consistent without
 * coupling feature screens to auth-specific components.
 */
export const appChrome = {
  cardRadius: radius.xxl,
  cardPadding: spacing.xl,
  controlRadius: radius.lg,
  controlHeight: 54,
};

/** Animation durations and spring values for shared interactive components. */
export const motion = {
  fast: 140,
  normal: 220,
  slow: 360,
  pressScale: 0.97,
  spring: {
    damping: 18,
    stiffness: 240,
    mass: 0.8,
  },
};

export const theme = {
  colors,
  gradients,
  spacing,
  radius,
  typography,
  shadow,
  layout,
  controls,
  appChrome,
  motion,
};
export default theme;
