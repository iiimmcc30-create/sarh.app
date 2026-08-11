/**
 * Sarh Design System — SidebarMenuItem
 *
 * Target visual (Arabic UI):
 *   RIGHT                                         LEFT
 *   [ Icon ] [ Title ] ————————————— [ > ]
 *
 * Implementation isolates layout in a physical LTR row so app-level RTL
 * cannot reverse children again. Child order is left→right:
 *   [Chevron] [spacer] [Title][Icon]
 */
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { isNavigationLocked } from '@/lib/safeNavigate';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

export type SidebarMenuItemProps = {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  badge?: number;
  active?: boolean;
  showDivider?: boolean;
  showChevron?: boolean;
  iconColor?: string;
  colors?: ThemeColors;
  style?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
};

export const SIDEBAR_MENU_ITEM = {
  minHeight: 56,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  gap: spacing.md,
  iconSize: 20,
  iconWrap: 40,
  iconRadius: radius.md,
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
  const tint = iconColor ?? (active ? colors.electric : colors.textMuted);
  const showBadge = typeof badge === 'number' && badge > 0;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ selected: active }}
      onPress={() => {
        // Ignore rapid re-taps while a transition is already in flight.
        if (isNavigationLocked()) return;
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.borderHairline },
        showDivider && styles.rowDivider,
        active && { backgroundColor: `${colors.electric}14` },
        pressed && styles.rowPressed,
        style,
      ]}
    >
      {/* Physical LEFT: quiet chevron */}
      {showChevron ? (
        <AppIcon
          name="angle-left"
          size={SIDEBAR_MENU_ITEM.chevronSize}
          color={colors.textSubtle}
        />
      ) : null}

      {showBadge ? (
        <View style={[styles.badge, { backgroundColor: colors.electric }]}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}

      <View style={styles.spacer} />

      {/* Physical RIGHT: title then icon (icon at the far right) */}
      <View style={styles.rightContent}>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.iconWrap, { backgroundColor: `${tint}18` }]}>
          <AppIcon name={icon} size={SIDEBAR_MENU_ITEM.iconSize} color={tint} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /**
   * Locked to physical LTR so I18nManager RTL cannot reverse the row.
   * Left → Right children: chevron, spacer, title+icon.
   */
  row: {
    flexDirection: 'row',
    direction: 'ltr',
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
  rightContent: {
    flexDirection: 'row',
    direction: 'ltr',
    alignItems: 'center',
    gap: SIDEBAR_MENU_ITEM.gap,
    flexShrink: 1,
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
    ...getRtlText(),
    writingDirection: 'rtl',
  },
  subtitle: {
    ...typography.caption,
    fontSize: SIDEBAR_MENU_ITEM.subtitleSize,
    lineHeight: 18,
    ...getRtlText(),
    writingDirection: 'rtl',
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
    color: '#F4F7F9',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default SidebarMenuItem;
