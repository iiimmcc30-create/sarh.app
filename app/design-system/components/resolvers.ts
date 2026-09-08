import { getRtlDirection, getRtlText } from '@/lib/rtl';
import type { TextStyle, ViewStyle } from 'react-native';
import { colors, elevation, functional, radius, space, typography, type TypeRole } from '../tokens';

export type AppTextVariant = TypeRole;
export type AppTextColor =
  | 'textPrimary'
  | 'textSecondary'
  | 'textMuted'
  | 'primary'
  | 'danger'
  | 'warning'
  | 'success';
export type AppTextAlign = 'auto' | 'center' | 'left' | 'right';

export const APP_TEXT_COLOR = {
  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textMuted: colors.textMuted,
  primary: colors.primary,
  danger: colors.danger,
  warning: colors.warning,
  success: colors.success,
} as const;

export function resolveAppTextStyle(options: {
  variant?: AppTextVariant;
  color?: AppTextColor;
  align?: AppTextAlign;
}): TextStyle {
  const variant = options.variant ?? 'body';
  const color = options.color ?? 'textPrimary';
  const role = typography[variant];
  const align = options.align && options.align !== 'auto' ? { textAlign: options.align } : null;
  return {
    ...getRtlText(),
    fontFamily: role.fontFamily,
    fontSize: role.fontSize,
    lineHeight: role.lineHeight,
    fontWeight: role.fontWeight,
    color: APP_TEXT_COLOR[color],
    ...align,
  };
}

export type SarhButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
export type SarhButtonState = 'default' | 'pressed' | 'disabled' | 'loading';
export type SarhButtonSize = 'sm' | 'md';
export type SarhButtonShape = 'rounded' | 'pill';

export const BUTTON_SIZE = {
  sm: { minHeight: space[32], paddingHorizontal: space[16] },
  md: { minHeight: space[48], paddingHorizontal: space[20] },
} as const;

export function resolveSarhButtonColors(
  variant: SarhButtonVariant,
  state: Exclude<SarhButtonState, 'loading'>,
) {
  const pressed = state === 'pressed';
  const disabled = state === 'disabled';
  if (variant === 'inverse') {
    return {
      backgroundColor: functional.onPrimary,
      borderColor: functional.onPrimary,
      contentColor: functional.onPrimaryInverse,
    };
  }
  if (variant === 'primary') {
    return {
      backgroundColor: pressed ? colors.primaryPressed : colors.primary,
      borderColor: pressed ? colors.primaryPressed : colors.primary,
      contentColor: functional.onPrimary,
    };
  }
  if (variant === 'danger') {
    return {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
      contentColor: functional.onPrimary,
    };
  }
  if (variant === 'secondary') {
    return {
      backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
      borderColor: colors.borderStrong,
      contentColor: colors.textPrimary,
    };
  }
  return {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    contentColor: disabled ? colors.textMuted : colors.primary,
  };
}

export type SarhIconButtonSize = 'sm' | 'md' | 'lg';
export type SarhIconButtonState = 'default' | 'pressed' | 'disabled' | 'selected';
export type SarhIconButtonChrome = 'solid' | 'ghost';

export const ICON_BUTTON_SIZE = {
  sm: { box: space[48], icon: space[16] + space[4] },
  md: { box: space[48], icon: space[24] },
  lg: { box: space[64] - space[8], icon: space[24] + space[4] },
} as const;

export function resolveSarhIconButtonColors(
  state: SarhIconButtonState,
  chrome: SarhIconButtonChrome = 'solid',
) {
  if (chrome === 'ghost') {
    return {
      backgroundColor: 'transparent',
      contentColor: colors.textPrimary,
      borderColor: 'transparent',
    };
  }
  if (state === 'selected') {
    return {
      backgroundColor: colors.primary,
      contentColor: functional.onPrimary,
      borderColor: colors.primary,
    };
  }
  return {
    backgroundColor: colors.surface,
    contentColor: colors.textPrimary,
    borderColor: colors.border,
  };
}

export type SarhCardVariant = 'default' | 'elevated' | 'outlined' | 'plain';
export type SarhCardPadding = 'none' | 'sm' | 'md' | 'lg';

export const CARD_PADDING = {
  none: 0,
  sm: space[8],
  md: space[16],
  lg: space[24],
} as const;

export function resolveSarhCardStyle(variant: SarhCardVariant, padding: SarhCardPadding): ViewStyle {
  const pad = CARD_PADDING[padding];
  const base: ViewStyle = {
    borderRadius: radius[16],
    padding: pad,
    overflow: 'hidden',
    ...getRtlDirection(),
  };

  if (variant === 'plain') {
    return {
      ...base,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 0,
      ...elevation.none,
    };
  }
  if (variant === 'elevated') {
    return {
      ...base,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 0,
      ...elevation.raised,
    };
  }
  if (variant === 'outlined') {
    return {
      ...base,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      ...elevation.none,
    };
  }
  return {
    ...base,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  };
}

export type SarhInputState = 'default' | 'focused' | 'error' | 'disabled';

export function resolveSarhInputBorder(state: SarhInputState) {
  if (state === 'error') return colors.danger;
  if (state === 'focused') return colors.primary;
  return colors.border;
}

export type SarhAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const AVATAR_SIZE = {
  xs: space[24],
  sm: space[32],
  md: space[40],
  lg: space[48] + space[4],
  xl: space[64] + space[8],
} as const;

export function avatarInitials(name?: string, fallback?: string) {
  const source = (name ?? fallback ?? '').trim();
  if (!source) return '؟';
  const parts = source.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join('');
}

export type SarhBadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'primary';
export type SarhBadgeState = 'default' | 'disabled';

export function resolveSarhBadgeColors(tone: SarhBadgeTone) {
  if (tone === 'success') {
    return { backgroundColor: functional.primaryMuted, color: 'success' as const };
  }
  if (tone === 'warning') {
    return { backgroundColor: colors.surfaceAlt, color: 'warning' as const };
  }
  if (tone === 'danger') {
    return { backgroundColor: colors.surfaceAlt, color: 'danger' as const };
  }
  if (tone === 'primary') {
    return { backgroundColor: functional.primaryMuted, color: 'primary' as const };
  }
  return { backgroundColor: colors.surfaceAlt, color: 'textSecondary' as const };
}

export type SarhChipState = 'default' | 'selected' | 'disabled';

export function resolveSarhChipColors(selected: boolean) {
  if (selected) {
    return {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      text: 'textPrimary' as const,
      textOverride: functional.onPrimary,
    };
  }
  return {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    text: 'textSecondary' as const,
    textOverride: undefined,
  };
}

export type SarhSurfaceTone = 'background' | 'surface' | 'surfaceElevated' | 'surfaceAlt';

export const SURFACE_TONE = {
  background: colors.background,
  surface: colors.surface,
  surfaceElevated: colors.surfaceElevated,
  surfaceAlt: colors.surfaceAlt,
} as const;
