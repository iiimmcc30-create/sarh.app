/**
 * Sarh screen shell — matches ProfileScreenLayout dark-mode look.
 * Use screenRoot for page backgrounds; bgSurface for cards.
 */
import { StyleSheet, type ViewStyle } from 'react-native';
import { ds } from '@/constants/designSystem';
import { sarh } from '@/constants/sarhTokens';
import { appChrome, shadow, spacing, type ColorScheme, type ThemeColors } from '@/constants/theme';

/** Page background: transparent in dark (pattern shows), solid in light. */
export function sarhScreenRoot(scheme: ColorScheme, colors: ThemeColors): string {
  return scheme === 'dark' ? 'transparent' : colors.bgDeep;
}

export function sarhScreenStyles(colors: ThemeColors, scheme: ColorScheme) {
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
      backgroundColor: colors.bgGlassStrong,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      ...shadow.soft,
    } satisfies ViewStyle,
    card: {
      backgroundColor: colors.bgGlassStrong,
      borderRadius: appChrome.cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      ...shadow.card,
    } satisfies ViewStyle,
    sectionCard: {
      marginHorizontal: spacing.lg,
      backgroundColor: colors.bgGlassStrong,
      borderRadius: appChrome.cardRadius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      overflow: 'hidden' as const,
      ...shadow.card,
    } satisfies ViewStyle,
  };
}
