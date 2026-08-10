/**
 * Sarh Design System — SidebarMenuItem
 *
 * Visual layout (Arabic RTL):
 *   right edge → [ Icon ][ Title ][ flexible space ][ > ] ← left edge
 *
 * Icon + title stay grouped on the inline-start side; a flex spacer
 * pins the quiet chevron to the far inline-end side.
 */
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { I18nManager, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

export type SidebarMenuItemProps = {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  badge?: number;
  /** Highlight current route (e.g. market sidebar). */
  active?: boolean;
  /** Draw a bottom hairline divider. Default true. */
  showDivider?: boolean;
  /** Show trailing chevron. Default true. */
  showChevron?: boolean;
  iconColor?: string;
  /** Optional override when parent already has theme colors. */
  colors?: ThemeColors;
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
};

/** Shared metrics — keep every nav row identical across the app. */
export const SIDEBAR_MENU_ITEM = {
  minHeight: 56,
  paddingHorizontal: spacing.md,
  paddingVertical: 14,
  gap: spacing.md,
  iconSize: 20,
  iconWrap: 40,
  iconRadius: 12,
  titleSize: 15,
  titleWeight: '600' as const,
  subtitleSize: 12,
  chevronSize: 14,
} as const;

export function SidebarMenuItem({
  icon,
  title,
  subtitle,
  onPress,
  badge,
  active = false,
  showDivider = true,
  showChevron = true,
  iconColor,
  colors: colorsProp,
  style,
  accessibilityLabel,
  testID,
}: SidebarMenuItemProps) {
  const theme = useTheme();
  const colors = colorsProp ?? theme.colors;
  const isRtl = I18nManager.isRTL;
  const tint = iconColor ?? (active ? colors.electric : colors.textMuted);
  const showBadge = typeof badge === 'number' && badge > 0;

  /**
   * Explicit visual axis:
   * - RTL: row-reverse so the first child sits on the physical right
   * - LTR: row so the first child sits on the physical left
   * Children order is always: [startCluster][spacer][badge?][chevron?]
   */
  const axis = isRtl ? 'row-reverse' : 'row';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          flexDirection: axis,
          borderBottomColor: colors.borderHairline,
        },
        showDivider && styles.rowDivider,
        active && { backgroundColor: `${colors.electric}14` },
        pressed && styles.rowPressed,
        style,
      ]}
    >
      {/* Icon + title stay glued together on the start edge (right in RTL). */}
      <View style={[styles.startCluster, { flexDirection: axis }]}>
        <View style={[styles.iconWrap, { backgroundColor: `${tint}18` }]}>
          <AppIcon name={icon} size={SIDEBAR_MENU_ITEM.iconSize} color={tint} />
        </View>
        <View style={styles.textWrap}>
          <Text
            style={[
              styles.title,
              {
                color: colors.textPrimary,
                textAlign: isRtl ? 'right' : 'left',
                writingDirection: isRtl ? 'rtl' : 'ltr',
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textMuted,
                  textAlign: isRtl ? 'right' : 'left',
                  writingDirection: isRtl ? 'rtl' : 'ltr',
                },
              ]}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Flexible space pushes chevron/badge to the far end (left in RTL). */}
      <View style={styles.spacer} />

      {showBadge ? (
        <View style={[styles.badge, { backgroundColor: colors.electric }]}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}

      {showChevron ? (
        <AppIcon
          name={isRtl ? 'angle-left' : 'angle-right'}
          size={SIDEBAR_MENU_ITEM.chevronSize}
          color={colors.textSubtle}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: SIDEBAR_MENU_ITEM.paddingHorizontal,
    paddingVertical: SIDEBAR_MENU_ITEM.paddingVertical,
    minHeight: SIDEBAR_MENU_ITEM.minHeight,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: {
    opacity: 0.76,
  },
  startCluster: {
    alignItems: 'center',
    gap: SIDEBAR_MENU_ITEM.gap,
    flexShrink: 1,
    maxWidth: '85%',
  },
  iconWrap: {
    width: SIDEBAR_MENU_ITEM.iconWrap,
    height: SIDEBAR_MENU_ITEM.iconWrap,
    borderRadius: SIDEBAR_MENU_ITEM.iconRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flexShrink: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: SIDEBAR_MENU_ITEM.titleSize,
    fontWeight: SIDEBAR_MENU_ITEM.titleWeight,
  },
  subtitle: {
    ...typography.caption,
    fontSize: SIDEBAR_MENU_ITEM.subtitleSize,
    lineHeight: 18,
  },
  spacer: {
    flex: 1,
    minWidth: SIDEBAR_MENU_ITEM.gap,
  },
  badge: {
    minWidth: 24,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    flexShrink: 0,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
});

export default SidebarMenuItem;
