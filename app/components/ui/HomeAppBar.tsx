import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { elevatedControlStyle, MENU_CARD } from '@/components/feature/SidebarMenu';
import { ds } from '@/constants/designSystem';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow, getRtlText } from '@/lib/rtl';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type HomeAppBarProps = {
  onMenu: () => void;
  onSearch: () => void;
  onLive?: () => void;
  showLive?: boolean;
  searchPlaceholder?: string;
};

/** Reference header: menu (right) · search pill · notifications (left) */
export function HomeAppBar({
  onMenu,
  onSearch,
  searchPlaceholder = 'ابحث عن خدمة معينة',
}: HomeAppBarProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  return (
    <View style={[styles.bar, getRtlRow()]}>
      <Pressable onPress={onMenu} style={styles.iconBtn} hitSlop={8} accessibilityLabel="القائمة">
        <AppIcon name="menu" size={ds.icon.md} color={colors.textPrimary} />
      </Pressable>

      <Pressable
        onPress={onSearch}
        style={[styles.searchPill, getRtlRow()]}
        accessibilityRole="search"
        accessibilityLabel={searchPlaceholder}
      >
        <Text style={styles.searchPlaceholder} numberOfLines={1}>
          {searchPlaceholder}
        </Text>
        <AppIcon name="search" size={ds.icon.md} color={colors.textPrimary} />
      </Pressable>

      <NotificationBellButton
        size={ds.iconBtn.md}
        iconSize={ds.icon.md}
        style={styles.iconBtn}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bar: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      minHeight: 56,
      gap: spacing.sm,
      backgroundColor: 'transparent',
    },
    searchPill: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      ...elevatedControlStyle(colors),
      borderRadius: MENU_CARD.controlRadius,
    },
    searchPlaceholder: {
      ...typography.body,
      ...getRtlText(),
      flex: 1,
      color: colors.textMuted,
      fontSize: 14,
    },
    iconBtn: {
      width: ds.iconBtn.md,
      height: ds.iconBtn.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...elevatedControlStyle(colors),
      borderRadius: 12,
    },
  });
}

export default HomeAppBar;
