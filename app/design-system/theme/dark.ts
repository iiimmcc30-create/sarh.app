import {
  colors,
  duration,
  elevation,
  fontFamily,
  functional,
  motion,
  radius,
  space,
  typography,
} from '../tokens';

/**
 * Nested semantic layer — future components should read these names,
 * never raw hex. Values equal the extracted Sarh Dark tokens.
 */
export const semantic = {
  background: colors.background,
  surface: colors.surface,
  surfaceElevated: colors.surfaceElevated,
  surfaceAlt: colors.surfaceAlt,
  text: {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
  },
  action: {
    primary: colors.primary,
    primaryPressed: colors.primaryPressed,
  },
  border: {
    default: colors.border,
    strong: colors.borderStrong,
  },
  status: {
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  },
} as const;

export const darkTheme = {
  scheme: 'dark' as const,
  colors,
  semantic,
  functional,
  typography,
  fontFamily,
  space,
  radius,
  elevation,
  motion,
  duration,
};

export type DarkTheme = typeof darkTheme;
