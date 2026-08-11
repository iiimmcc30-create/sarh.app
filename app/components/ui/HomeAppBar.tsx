import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { ds } from '@/constants/designSystem';
import { sarh } from '@/constants/sarhTokens';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow } from '@/lib/rtl';
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
    styles: createStyles(theme.colors, theme.scheme),
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
        <AppIcon name="search" size={ds.icon.md} color={colors.textMuted} />
      </Pressable>

      <NotificationBellButton
        size={ds.iconBtn.md}
        iconSize={ds.icon.md}
        style={styles.iconBtn}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const isDark = scheme === 'dark';
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
      borderRadius: sarh.radius.pill,
      backgroundColor: isDark ? sarh.color.surfaceRaised : ds.light.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? sarh.color.border : ds.light.stroke,
      gap: spacing.sm,
    },
    searchPlaceholder: {
      ...typography.body,
      writingDirection: 'rtl', textAlign: 'right', flex: 1,
      color: colors.textMuted,
      fontSize: 14,
    },
    iconBtn: {
      width: ds.iconBtn.md,
      height: ds.iconBtn.md,
      borderRadius: sarh.radius.md,
      backgroundColor: isDark ? sarh.color.surfaceRaised : ds.light.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? sarh.color.border : ds.light.stroke,
    },
  });
}

export default HomeAppBar;
