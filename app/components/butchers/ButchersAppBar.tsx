import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { MENU_CARD } from '@/components/feature/SidebarMenu';
import { ds } from '@/constants/designSystem';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

type ButchersAppBarProps = {
  onMenu: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
};

/** Butchers header — menu · inline search · notifications (same chrome as home/market). */
export function ButchersAppBar({
  onMenu,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'ابحث عن ملحمة، مدينة، أو نوع لحم...',
}: ButchersAppBarProps) {
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

        <View style={[styles.searchPill, getRtlRow()]}>
          <AppIcon name="search" size={ds.icon.sm} color={colors.textPrimary} />
          <View style={styles.rtlTextShell}>
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={onSearchChange}
              textAlign="right"
              returnKeyType="search"
              accessibilityLabel={searchPlaceholder}
            />
          </View>
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => onSearchChange('')} hitSlop={8} accessibilityLabel="مسح البحث">
              <AppIcon name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

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
    rtlTextShell: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
    },
    searchInput: {
      ...typography.body,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
      color: colors.textPrimary,
      fontSize: 14,
      paddingVertical: 0,
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

export default ButchersAppBar;
