/**
 * Sarh Design System — SidebarMenuItem
 *
 * Fixed visual result (no row-reverse, no double RTL flip):
 *
 *   RIGHT                                         LEFT
 *   [ Icon ] [ Title ] ———————— [ > ]
 *
 * App-level RTL already mirrors `flexDirection: 'row'`, so children
 * are declared in logical start→end order and must NOT be reversed again.
 */
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

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
  const tint = iconColor ?? (active ? colors.electric : colors.textMuted);
  const showBadge = typeof badge === 'number' && badge > 0;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.borderHairline },
        showDivider && styles.rowDivider,
        active && { backgroundColor: `${colors.electric}14` },
        pressed && styles.rowPressed,
        style,
      ]}
    >
      {/* Start cluster (physical right under app RTL): Icon then Title */}
      <View style={styles.rightContent}>
        <View style={[styles.iconWrap, { backgroundColor: `${tint}18` }]}>
          <AppIcon name={icon} size={SIDEBAR_MENU_ITEM.iconSize} color={tint} />
        </View>
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
      </View>

      <View style={styles.spacer} />

      {showBadge ? (
        <View style={[styles.badge, { backgroundColor: colors.electric }]}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}

      {showChevron ? (
        <AppIcon
          name="angle-left"
          size={SIDEBAR_MENU_ITEM.chevronSize}
          color={colors.textSubtle}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /**
   * IMPORTANT:
   * - flexDirection is always 'row' — never 'row-reverse'
   * - direction is 'rtl' once so the first child sits on the physical right
   * - Do not combine with another reverse on parents
   *
   * Children order: [rightContent(Icon, Title)] [spacer] [chevron]
   * Visual: RIGHT Icon Title ——— LEFT chevron
   */
  row: {
    flexDirection: 'row',
    direction: 'rtl',
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
    direction: 'rtl',
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
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    ...typography.caption,
    fontSize: SIDEBAR_MENU_ITEM.subtitleSize,
    lineHeight: 18,
    textAlign: 'right',
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
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
});

export default SidebarMenuItem;
