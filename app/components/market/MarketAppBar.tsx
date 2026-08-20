import { AppIcon } from '@/components/ui/FlaticonIcon';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, View } from 'react-native';

const CONTROL = 48;

type Props = {
  onSearch: () => void;
  onFilterPress: () => void;
  onSortPress: () => void;
  onFeaturedPress: () => void;
  featuredActive?: boolean;
  searchPlaceholder?: string;
  sortLabel?: string;
};

/** Market chrome: filter · sort · search · featured star (physical LTR). */
export function MarketAppBar({
  onSearch,
  onFilterPress,
  onSortPress,
  onFeaturedPress,
  featuredActive = false,
  searchPlaceholder = 'ابحث في السوق',
  sortLabel = 'الأحدث',
}: Props) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  return (
    <View style={styles.shell}>
      <View style={styles.bar}>
        <Pressable
          onPress={onFilterPress}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="تصفية"
        >
          <AppIcon name="settings-sliders" size={20} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          onPress={onSortPress}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={sortLabel}
        >
          <AppIcon name="sort-alt" size={20} color={colors.textPrimary} />
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

        <Pressable
          onPress={onFeaturedPress}
          style={[styles.iconBtn, featuredActive && styles.iconBtnActive]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="الإعلانات المميزة"
          accessibilityState={{ selected: featuredActive }}
        >
          <AppIcon
            name="star"
            size={20}
            color={featuredActive ? colors.gold : colors.textPrimary}
            variant={featuredActive ? 'sr' : 'rr'}
          />
        </Pressable>
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
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 56,
      gap: spacing.sm,
    },
    iconBtn: {
      width: CONTROL,
      height: CONTROL,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    iconBtnActive: {
      borderColor: colors.gold,
      backgroundColor: `${colors.gold}14`,
    },
    searchPill: {
      flex: 1,
      height: CONTROL,
      minHeight: CONTROL,
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.bgElevated,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    searchPlaceholder: {
      ...typography.secondary,
      color: colors.textMuted,
    },
  });
}

export default MarketAppBar;
