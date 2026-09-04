// SAFAT — Logo-aligned brand theme (forest green · white · black)
// Supports dark + light palettes; apply via bootstrap before app modules load.

import { luxuryDark } from './homeLuxury';
import { sarh } from './sarhTokens';
import { OFFICIAL_APP_FONT } from './fonts';

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
  emerald: '#20B66F',
  rose: '#F43F5E',
  amber: '#FBBF24',
  /** Align success with brand accent — one green identity */
  success: '#20B66F',
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
  bgGlassStrong: 'rgba(12, 28, 39, 0.96)',
  bgOverlay: 'rgba(7, 19, 28, 0.78)',
  royal: luxuryDark.surfaceAlt,
  royalDeep: luxuryDark.bg,
  electric: luxuryDark.accent,
  electricBright: luxuryDark.accent,
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
  borderStrong: '#264556',
  borderHairline: luxuryDark.border,
  ...sharedAccents,
};

const lightColors: BaseThemeColors = {
  bgDeep: '#F5F7F9',
  bgPrimary: '#F5F7F9',
  bgSurface: '#FFFFFF',
  bgElevated: '#FFFFFF',
  bgGlass: 'rgba(255, 255, 255, 0.90)',
  bgGlassStrong: 'rgba(255, 255, 255, 0.96)',
  bgOverlay: 'rgba(16, 24, 32, 0.45)',
  royal: '#EAF3EE',
  royalDeep: '#D8EBE0',
  /** Keep existing brand accent (not a new identity color) */
  electric: '#20B66F',
  electricBright: '#20B66F',
  glow: '#18965B',
  cyan: '#20B66F',
  silver: '#65727D',
  silverBright: '#101820',
  textPrimary: '#101820',
  textSecondary: '#65727D',
  textMuted: '#8D99A3',
  textSubtle: '#8D99A3',
  borderSoft: '#E6EBEF',
  borderMid: '#E6EBEF',
  borderStrong: '#D5DEE5',
  borderHairline: '#E6EBEF',
  ...sharedAccents,
};

const darkGradients: ThemeGradients = {
  hero: [luxuryDark.bg, luxuryDark.bg, luxuryDark.card],
  royal: [luxuryDark.bg, luxuryDark.surface, luxuryDark.surfaceAlt],
  glass: [luxuryDark.tabGlass, luxuryDark.bg],
  liveOverlay: ['transparent', 'rgba(7,19,28,0.45)', 'rgba(7,19,28,0.96)'],
  card: [luxuryDark.card, luxuryDark.card],
  cardHover: [luxuryDark.surface, luxuryDark.card],
  goldRing: ['#F5C56A', '#FBBF24', '#F5C56A'],
  electric: [luxuryDark.accent, luxuryDark.accent, luxuryDark.accent],
  primary: [luxuryDark.accent, luxuryDark.accentPressed, luxuryDark.surface],
  rim: ['rgba(27,52,66,0.55)', 'rgba(27,52,66,0)'],
};

const lightGradients: ThemeGradients = {
  hero: ['#F5F7F9', '#F5F7F9', '#FFFFFF'],
  royal: ['#EAF3EE', '#D8EBE0', '#20B66F'],
  glass: ['rgba(255,255,255,0.96)', 'rgba(245,247,249,0.90)'],
  liveOverlay: ['transparent', 'rgba(255,255,255,0.35)', 'rgba(245,247,249,0.96)'],
  card: ['#FFFFFF', '#FFFFFF'],
  cardHover: ['#FFFFFF', '#F5F7F9'],
  goldRing: ['#F5C56A', '#FBBF24', '#F5C56A'],
  electric: ['#20B66F', '#18965B', '#20B66F'],
  primary: ['#20B66F', '#18965B', '#EAF3EE'],
  rim: ['rgba(230,235,239,0.9)', 'rgba(230,235,239,0)'],
};

export function createShadow(palette: BaseThemeColors) {
  const isLight = palette === lightColors;
  return {
    glow: {
      shadowColor: palette.glow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isLight ? 0.12 : 0.18,
      shadowRadius: 8,
      elevation: 3,
    },
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isLight ? 0.03 : 0.08,
      shadowRadius: isLight ? 6 : 4,
      elevation: 1,
    },
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: isLight ? 2 : 1 },
      shadowOpacity: isLight ? 0.04 : 0.08,
      shadowRadius: isLight ? 8 : 4,
      elevation: isLight ? 2 : 1,
    },
    pressed: {
      shadowColor: palette.electric,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.16,
      shadowRadius: 4,
      elevation: 2,
    },
  };
}

let activeScheme: ColorScheme = 'dark';

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
      // Opaque — never transparent. React Navigation tab scenes paint white
      // behind transparent screens and cause a persistent light flash/leak.
      screenRoot: palette.bgDeep,
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

// Synchronous init — colors must never be an empty object at first render.
applyThemeScheme('dark');

/** Gradients that must react to light/dark at runtime (not frozen in StyleSheet). */
export function headerFadeGradient(scheme: ColorScheme): readonly [string, string] {
  return scheme === 'light'
    ? ['rgba(245, 247, 249, 0.98)', 'rgba(245, 247, 249, 0)']
    : ['rgba(7, 19, 28, 0.98)', 'rgba(7, 19, 28, 0)'];
}

export function imageCardOverlay(scheme: ColorScheme): readonly [string, string] {
  return scheme === 'light'
    ? ['transparent', 'rgba(16, 24, 32, 0.68)']
    : ['transparent', 'rgba(7, 19, 28, 0.88)'];
}

export function imageCardOverlayStrong(scheme: ColorScheme): readonly [string, string] {
  return scheme === 'light'
    ? ['transparent', 'rgba(16, 24, 32, 0.78)']
    : ['transparent', 'rgba(7, 19, 28, 0.94)'];
}

export function scrimColor(scheme: ColorScheme, opacity = 0.85): string {
  return scheme === 'light'
    ? `rgba(245, 247, 249, ${opacity})`
    : `rgba(7, 19, 28, ${opacity})`;
}

/**
 * Sidebar / drawer panel page tone — matches the app screen root in dark mode
 * so section cards (bgSurface) read like home listing/post cards.
 */
export function panelSurfaceBg(scheme: ColorScheme, palette: ThemeColors): string {
  return scheme === 'dark' ? palette.bgDeep : palette.bgSurface;
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
  xxl: sarh.radius.xl,
  pill: sarh.radius.pill,
};

/** RTL policy: writingDirection only. Never add textAlign:'right' here (swap mirrors it). */
const directionalText = {
  writingDirection: 'rtl' as const,
};

/** Same face as listing price (`IBMPlexSansArabic_700Bold`) — sole UI typeface. */
const officialFace = {
  fontFamily: OFFICIAL_APP_FONT,
  fontWeight: '700' as const,
};
const face500 = officialFace;
const face600 = officialFace;
const face700 = officialFace;

/**
 * Sarh content typography — sizes 12 / 14 / 15 / 16 / 18 / 20 / 24.
 * All tokens use the official listing-price Bold face (`OFFICIAL_APP_FONT`).
 * `tab` / `tabActive` keep frozen sizes for bottom navigation.
 */
export const typography = {
  display: {
    fontSize: 24,
    lineHeight: 32,
    ...face700,
    ...directionalText,
  },
  sectionHeading: {
    fontSize: 20,
    lineHeight: 28,
    ...face700,
    ...directionalText,
  },
  cardHeadingLarge: {
    fontSize: 18,
    lineHeight: 26,
    ...face600,
    ...directionalText,
  },
  cardHeading: {
    fontSize: 16,
    lineHeight: 24,
    ...face600,
    ...directionalText,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    ...face500,
    ...directionalText,
  },
  smallHeading: {
    fontSize: 14,
    lineHeight: 20,
    ...face500,
    ...directionalText,
  },
  secondary: {
    fontSize: 14,
    lineHeight: 20,
    ...face500,
    ...directionalText,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    ...face600,
    ...directionalText,
  },
  value: {
    fontSize: 16,
    lineHeight: 22,
    ...face700,
    ...directionalText,
  },
  valueLarge: {
    fontSize: 18,
    lineHeight: 24,
    ...face700,
    ...directionalText,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    ...face500,
    ...directionalText,
  },
  badge: {
    fontSize: 12,
    lineHeight: 18,
    ...face600,
    ...directionalText,
  },

  /** @deprecated Use `display` */
  h1: {
    fontSize: 24,
    lineHeight: 32,
    ...face700,
    ...directionalText,
  },
  /** @deprecated Use `sectionHeading` */
  h2: {
    fontSize: 20,
    lineHeight: 28,
    ...face700,
    ...directionalText,
  },
  /** @deprecated Use `cardHeadingLarge` */
  h3: {
    fontSize: 18,
    lineHeight: 26,
    ...face600,
    ...directionalText,
  },
  /** @deprecated Use `button` for CTAs */
  bodyStrong: {
    fontSize: 15,
    lineHeight: 20,
    ...face600,
    ...directionalText,
  },
  /** @deprecated Use `caption` */
  micro: {
    fontSize: 12,
    lineHeight: 18,
    ...face500,
    ...directionalText,
  },
  /**
   * Frozen — FloatingTabBar / ButchersTabBar only.
   * Do not change size, weight, or line height.
   */
  tab: {
    fontFamily: OFFICIAL_APP_FONT,
    fontWeight: '700' as const,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center' as const,
    ...directionalText,
  },
  /**
   * Frozen — active bottom-tab label.
   * Do not change size, weight, or line height.
   */
  tabActive: {
    fontFamily: OFFICIAL_APP_FONT,
    fontWeight: '700' as const,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center' as const,
    ...directionalText,
  },
  emphasis: {
    ...face500,
    ...directionalText,
  },
  /** Card / list titles — 16 / 600 / 24 */
  feedTitle: {
    fontSize: 16,
    lineHeight: 24,
    ...face600,
    ...directionalText,
  },
  /** Secondary / meta copy — 14 / 500 / 20 */
  feedBody: {
    fontSize: 14,
    lineHeight: 20,
    ...face500,
    ...directionalText,
  },
};

/** Shared 2026 layout metrics. Keep screens visually consistent across device sizes. */
export const layout = {
  screenPadding: spacing.lg,
  sectionGap: spacing.xxl,
  contentMaxWidth: 720,
  headerHeight: 60,
  tabBarHeight: 56,
};

export const controls = {
  heightSm: 40,
  heightMd: 48,
  heightLg: 52,
  iconButton: 40,
  minTouchTarget: 44,
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
  motion,
};
export default theme;
