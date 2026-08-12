import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { MENU_CARD } from '@/components/feature/SidebarMenu';
import { ds } from '@/constants/designSystem';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
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
          <AppIcon name="menu" size={ds.icon.md} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          onPress={onSearch}
          style={[styles.searchPill, getRtlRow()]}
          accessibilityRole="search"
          accessibilityLabel={searchPlaceholder}
        >
          <AppIcon name="search" size={ds.icon.sm} color={colors.textPrimary} />
          <View style={styles.rtlTextShell}>
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              {searchPlaceholder}
            </Text>
          </View>
        </Pressable>

        <NotificationBellButton
          size={ds.iconBtn.md}
          iconSize={ds.icon.md}
          style={styles.notifBtn}
          iconColor={colors.textPrimary}
          badgeBorderColor={colors.bgElevated}
        />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    /** Same elevated surface as listing cards (listRow). */
    shell: {
      backgroundColor: colors.bgElevated,
      borderBottomWidth: 0,
      flexGrow: 0,
      flexShrink: 0,
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
      minHeight: 44,
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.bgDeep,
      borderRadius: MENU_CARD.controlRadius,
      borderWidth: 0,
    },
    /** Physical LTR shell — same as AppTextInput / listing titles. */
    rtlTextShell: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
    },
    searchPlaceholder: {
      ...typography.body,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
      color: colors.textMuted,
      fontSize: 14,
    },
    iconBtn: {
      width: ds.iconBtn.md,
      height: ds.iconBtn.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgDeep,
      borderRadius: 12,
      borderWidth: 0,
    },
    notifBtn: {
      backgroundColor: colors.bgDeep,
      borderRadius: 12,
    },
  });
}

export default MarketAppBar;
