/**
 * Sarh Design System — luxury minimal, 8pt grid, glass-lite surfaces.
 * UI tokens only; no business logic.
 */
import { Platform, type ViewStyle } from 'react-native';

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
    page: '#090909',
    card: '#151515',
    cardGradientEnd: '#1C1C1C',
    elevated: '#1C1C1C',
    primary: '#69D84F',
    accent: '#69D84F',
    primaryMuted: 'rgba(105, 216, 79, 0.14)',
    glass: 'rgba(9, 9, 9, 0.88)',
    glassBorder: '#262626',
    stroke: '#262626',
    glow: '#69D84F',
  },

  /** 8pt grid */
  space: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },

  /** Continuous-style corners */
  radius: {
    sm: 12,
    md: 16,
    lg: 22,
    xl: 22,
    xxl: 28,
    pill: 999,
    fab: 28,
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
  const green = isLight ? '#0B6B3A' : '#69D84F';

  if (level === 'fab') {
    return Platform.select({
      ios: {
        shadowColor: green,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isLight ? 0.28 : 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
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
