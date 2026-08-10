/**
 * Sarh screen shell — matches ProfileScreenLayout dark-mode look.
 * Use screenRoot for page backgrounds; bgSurface for cards.
 */
import { StyleSheet, type ViewStyle } from 'react-native';
import { ambientShadow, ds } from '@/constants/designSystem';
import { sarh } from '@/constants/sarhTokens';
import { spacing, type ColorScheme, type ThemeColors } from '@/constants/theme';

/** Page background — always opaque to block React Navigation white scenes. */
export function sarhScreenRoot(scheme: ColorScheme, colors: ThemeColors): string {
  return scheme === 'dark' ? (colors.bgDeep || sarh.color.bg) : colors.bgDeep;
}

export function sarhScreenStyles(colors: ThemeColors, scheme: ColorScheme) {
  const tokens = scheme === 'light' ? ds.light : ds.dark;
  const isDark = scheme === 'dark';

  return {
    screenRoot: {
      flex: 1,
      backgroundColor: sarhScreenRoot(scheme, colors),
    } satisfies ViewStyle,
    headerBar: {
      backgroundColor: sarhScreenRoot(scheme, colors),
    } satisfies ViewStyle,
    iconBtn: {
      width: ds.iconBtn.md,
      height: ds.iconBtn.md,
      borderRadius: sarh.radius.pill,
      backgroundColor: isDark ? 'rgba(16, 31, 44, 0.72)' : tokens.glass,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? sarh.color.border : tokens.stroke,
      ...ambientShadow(scheme, 'soft'),
    } satisfies ViewStyle,
    card: {
      backgroundColor: isDark ? sarh.color.surface : colors.bgSurface,
      borderRadius: sarh.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? sarh.color.border : colors.borderSoft,
      ...ambientShadow(scheme, 'soft'),
    } satisfies ViewStyle,
    sectionCard: {
      marginHorizontal: spacing.lg,
      backgroundColor: isDark ? sarh.color.surface : colors.bgSurface,
      borderRadius: sarh.radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? sarh.color.border : colors.borderSoft,
      overflow: 'hidden' as const,
      ...ambientShadow(scheme, 'soft'),
    } satisfies ViewStyle,
  };
}
