import { StyleSheet, type ViewStyle } from 'react-native';
import { MENU_CARD } from '@/components/feature/SidebarMenu';
import type { ColorScheme, ThemeColors } from '@/constants/theme';

/** Soft butcher cards — lighter than menu/listing `bgElevated` blocks. */
export function butcherSoftCardStyle(
  colors: ThemeColors,
  scheme: ColorScheme,
): ViewStyle {
  return {
    backgroundColor:
      scheme === 'light' ? 'rgba(255,255,255,0.52)' : colors.bgSurface,
    borderRadius: MENU_CARD.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
  };
}
