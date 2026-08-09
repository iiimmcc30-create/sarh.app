/**
 * Sarh Design System — luxury minimal, 8pt grid, glass-lite surfaces.
 * UI tokens only; no business logic.
 */
import { Platform, type ViewStyle } from 'react-native';
import { sarh } from './sarhTokens';

export const ds = {
  light: {
    page: '#FAFBF8',
    card: '#FFFFFF',
    cardGradientEnd: '#F8FAF7',
    primary: '#0B6B3A',
    primaryMuted: '#0B6B3A18',
    glass: 'rgba(255, 255, 255, 0.88)',
    glassBorder: 'rgba(0, 0, 0, 0.06)',
    stroke: 'rgba(0, 0, 0, 0.06)',
    glow: '#0B6B3A',
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
  },

  /** 8pt grid — aligned with sarhTokens */
  space: {
    xs: sarh.space.xs,
    sm: sarh.space.sm,
    md: sarh.space.lg,
    lg: sarh.space.xxl,
    xl: sarh.space.xxxl,
    xxl: 40,
  },

  /** Continuous-style corners */
  radius: {
    sm: sarh.radius.sm,
    md: sarh.radius.md,
    lg: sarh.radius.lg,
    xl: sarh.radius.card,
    xxl: 28,
    pill: sarh.radius.pill,
    fab: sarh.radius.fab,
    icon: 14,
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
    height: 64,
    fabSize: 58,
    fabLift: 18,
    marginH: 16,
    marginBottom: 8,
  },

  motion: {
    duration: 220,
    easing: 'ease-out' as const,
  },

  listingThumb: 140,
  categoryTile: 56,
};

export function ambientShadow(scheme: 'light' | 'dark', level: 'soft' | 'card' | 'fab' = 'card'): ViewStyle {
  const isLight = scheme === 'light';

  if (level === 'fab') {
    return Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isLight ? 0.12 : 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }) as ViewStyle;
  }

  if (level === 'soft') {
    return Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isLight ? 0.04 : 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }) as ViewStyle;
  }

  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isLight ? 0.06 : 0.14,
      shadowRadius: 14,
    },
    android: { elevation: 6 },
    default: {},
  }) as ViewStyle;
}
