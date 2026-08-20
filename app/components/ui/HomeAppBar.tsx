import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { ds } from '@/constants/designSystem';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, View } from 'react-native';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

type HomeAppBarProps = {
  onMore: () => void;
  onSearch: () => void;
  searchPlaceholder?: string;
};

/** iOS-style home header: more · search · notifications (RTL). */
export function HomeAppBar({
  onMore,
  onSearch,
  searchPlaceholder = 'ابحث في سرح',
}: HomeAppBarProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  return (
    <View style={styles.shell}>
      <View style={[styles.bar, getRtlRow()]}>
        <Pressable
          onPress={onMore}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityLabel="المزيد"
        >
          <AppIcon name="ellipsis-horizontal" size={ds.icon.md} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          onPress={onSearch}
          style={[styles.searchPill, getRtlRow()]}
          accessibilityRole="search"
          accessibilityLabel={searchPlaceholder}
        >
          <AppIcon name="search" size={20} color={colors.textMuted} />
          <RtlTextShell>
            <RtlText style={styles.searchPlaceholder} numberOfLines={1}>
              {searchPlaceholder}
            </RtlText>
          </RtlTextShell>
        </Pressable>

        <NotificationBellButton
          size={ds.iconBtn.md}
          iconSize={ds.icon.md}
          style={styles.iconBtn}
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
      backgroundColor: colors.screenRoot,
      flexGrow: 0,
      flexShrink: 0,
    },
    bar: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 56,
      gap: spacing.sm,
    },
    searchPill: {
      flex: 1,
      minHeight: 48,
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.bgElevated,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    searchPlaceholder: {
      ...typography.secondary,
      color: colors.textMuted,
    },
    iconBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
  });
}

export default HomeAppBar;
