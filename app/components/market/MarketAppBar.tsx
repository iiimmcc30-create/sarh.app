import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { elevatedControlStyle, MENU_CARD } from '@/components/feature/SidebarMenu';
import { ds } from '@/constants/designSystem';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { sarh } from '@/constants/sarhTokens';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow, getRtlText } from '@/lib/rtl';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onMenu: () => void;
  onSearch: () => void;
  searchPlaceholder?: string;
};

/** Haraj-style market header: menu · search pill · notifications (physical left). */
export function MarketAppBar({
  onMenu,
  onSearch,
  searchPlaceholder = 'ابحث في السوق',
}: Props) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  return (
    <View style={styles.shell}>
      <View style={[styles.bar, getRtlRow()]}>
        <Pressable onPress={onMenu} style={styles.iconBtn} hitSlop={8} accessibilityLabel="القائمة">
          <AppIcon name="menu" size={ds.icon.md} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={onSearch}
          style={[styles.searchPill, getRtlRow()]}
          accessibilityRole="search"
          accessibilityLabel={searchPlaceholder}
        >
          <AppIcon name="search" size={ds.icon.sm} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            {searchPlaceholder}
          </Text>
        </Pressable>

        <NotificationBellButton
          size={ds.iconBtn.md}
          iconSize={ds.icon.md}
          style={styles.notifBtn}
          iconColor="#FFFFFF"
          badgeBorderColor={sarh.color.action}
        />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    shell: {
      backgroundColor: colors.electric,
    },
    bar: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 52,
      gap: spacing.sm,
    },
    searchPill: {
      flex: 1,
      minHeight: 40,
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.bgDeep,
      borderRadius: 20,
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
    },
    notifBtn: {
      backgroundColor: 'transparent',
    },
  });
}

export default MarketAppBar;
