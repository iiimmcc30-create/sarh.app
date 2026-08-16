/**
 * Sarh Design System — premium surface hierarchy, spacing grid, glass-lite chrome.
 * UI tokens only; no business logic. Accent = existing brand green (#20B66F).
 */
import { Platform, type ViewStyle } from 'react-native';
import { sarh } from './sarhTokens';

export const ds = {
  light: {
    page: '#F5F7F9',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    cardGradientEnd: '#F5F7F9',
    primary: '#20B66F',
    primaryMuted: 'rgba(32, 182, 111, 0.12)',
    glass: 'rgba(255, 255, 255, 0.92)',
    glassBorder: '#E6EBEF',
    stroke: '#E6EBEF',
    glow: '#20B66F',
    textPrimary: '#101820',
    textSecondary: '#65727D',
    textMuted: '#8D99A3',
  },
  dark: {
    page: sarh.color.bg,
    card: sarh.color.surface,
    cardGradientEnd: sarh.color.surfaceRaised,
    elevated: sarh.color.surfaceRaised,
    primary: sarh.color.action,
    accent: sarh.color.action,
    primaryMuted: sarh.color.actionMuted,
    glass: sarh.color.overlay,
    glassBorder: sarh.color.border,
    stroke: sarh.color.border,
    glow: sarh.color.action,
    textPrimary: sarh.color.text,
    textSecondary: sarh.color.textSecondary,
    textMuted: sarh.color.textMuted,
  },

  /** Spacing grid: 4 / 8 / 12 / 16 / 20 / 24 / 32 (+ 40 for large chrome) */
  space: {
    xs: sarh.space.xs,
    sm: sarh.space.sm,
    md: sarh.space.lg,
    lg: sarh.space.xxl,
    xl: sarh.space.xxxl,
    xxl: 40,
  },

  /** Radius scale: 8 / 12 / 16 / 20 */
  radius: {
    sm: sarh.radius.sm,
    md: sarh.radius.md,
    lg: sarh.radius.lg,
    xl: sarh.radius.xl,
    xxl: sarh.radius.xl,
    pill: sarh.radius.pill,
    fab: sarh.radius.fab,
    icon: sarh.radius.md,
  },

  icon: {
    xs: 14,
    sm: 16,
    md: 18,
    tab: 20,
    fab: 26,
  },

  iconBtn: {
    sm: 36,
    md: 40,
  },

  tabBar: {
    /** Same chrome height as ButchersTabBar (paddingTop 8 + slot 48). */
    height: 56,
    fabSize: 22,
    fabLift: 0,
    marginH: 0,
    /** Minimum safe-area padding — matches ButchersTabBar. */
    marginBottom: sarh.space.sm,
  },

  motion: {
    duration: 220,
    easing: 'ease-out' as const,
  },

  listingThumb: 140,
  categoryTile: 56,
};

/** Prefer surface hierarchy + light borders over heavy shadows (especially in dark). */
export function ambientShadow(scheme: 'light' | 'dark', level: 'soft' | 'card' | 'fab' = 'card'): ViewStyle {
  const isLight = scheme === 'light';

  if (level === 'fab') {
    return Platform.select({
      ios: {
        shadowColor: '#101820',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isLight ? 0.1 : 0.14,
        shadowRadius: 6,
      },
      android: { elevation: isLight ? 3 : 2 },
      default: {},
    }) as ViewStyle;
  }

  if (level === 'soft') {
    return Platform.select({
      ios: {
        shadowColor: '#101820',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isLight ? 0.03 : 0.06,
        shadowRadius: isLight ? 6 : 3,
      },
      android: { elevation: isLight ? 1 : 0 },
      default: {},
    }) as ViewStyle;
  }

  return Platform.select({
    ios: {
      shadowColor: '#101820',
      shadowOffset: { width: 0, height: isLight ? 2 : 1 },
      shadowOpacity: isLight ? 0.04 : 0.08,
      shadowRadius: isLight ? 8 : 4,
    },
    android: { elevation: isLight ? 2 : 1 },
    default: {},
  }) as ViewStyle;
}
