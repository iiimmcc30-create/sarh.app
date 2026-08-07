// SAFAT — Common Styles (v2)
import { StyleSheet } from 'react-native';
import { getRtlRow } from '@/lib/rtl';
import { ds } from './designSystem';
import { colors, radius, spacing, shadow } from './theme';

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  glassPanel: {
    backgroundColor: colors.bgGlass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    borderRadius: ds.radius.lg,
  },
  glassPanelElevated: {
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    borderRadius: ds.radius.xl,
    ...shadow.card,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
  },
  pillActive: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.electric,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.electric,
  },
  centerRow: {
    ...getRtlRow(),
    alignItems: 'center',
  },
  spaceBetween: {
    ...getRtlRow(),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderHairline,
    marginVertical: spacing.lg,
  },
  iconBubble: {
    width: ds.iconBtn.md,
    height: ds.iconBtn.md,
    borderRadius: ds.radius.pill,
    backgroundColor: colors.bgSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default commonStyles;
