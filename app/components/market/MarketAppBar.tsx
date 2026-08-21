import { AppIcon } from '@/components/ui/FlaticonIcon';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, View } from 'react-native';

const SEARCH_H = 44;
const TOOL_H = 32;
const TOOL_ICON = 16;
const SEARCH_ICON = 16;

type Props = {
  onSearch: () => void;
  onFilterPress: () => void;
  onSortPress: () => void;
  onFeaturedPress: () => void;
  featuredActive?: boolean;
  searchPlaceholder?: string;
  sortLabel?: string;
};

/** Market header: filter (left) · search pill · featured star outside the pill. */
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
      <View style={[styles.topBar, getRtlRow()]}>
        <Pressable
          onPress={onFilterPress}
          style={styles.toolBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="تصفية"
        >
          <AppIcon name="settings-sliders" size={TOOL_ICON} color={colors.textPrimary} />
        </Pressable>

        <View style={[styles.searchPill, getRtlRow()]}>
          <Pressable
            onPress={onSortPress}
            style={styles.sortHit}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={sortLabel}
          >
            <AppIcon name="sort-alt" size={TOOL_ICON} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.searchDivider} />

          <Pressable
            onPress={onSearch}
            style={[styles.searchTap, getRtlRow()]}
            accessibilityRole="search"
            accessibilityLabel={searchPlaceholder}
          >
            <AppIcon name="search" size={SEARCH_ICON} color={colors.textMuted} />
            <RtlTextShell flex>
              <RtlText style={styles.searchPlaceholder} numberOfLines={1}>
                {searchPlaceholder}
              </RtlText>
            </RtlTextShell>
          </Pressable>
        </View>

        <Pressable
          onPress={onFeaturedPress}
          style={[styles.toolBtn, featuredActive && styles.toolBtnActive]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="الإعلانات المميزة"
          accessibilityState={{ selected: featuredActive }}
        >
          <AppIcon
            name="star"
            size={TOOL_ICON}
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
    topBar: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    toolBtn: {
      width: TOOL_H,
      height: TOOL_H,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      flexShrink: 0,
    },
    toolBtnActive: {
      borderColor: colors.gold,
      backgroundColor: `${colors.gold}14`,
    },
    searchPill: {
      flex: 1,
      minWidth: 0,
      height: SEARCH_H,
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
      backgroundColor: colors.bgElevated,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    sortHit: {
      width: TOOL_H,
      height: TOOL_H,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    searchTap: {
      flex: 1,
      minWidth: 0,
      height: '100%',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: spacing.xs,
    },
    searchDivider: {
      width: StyleSheet.hairlineWidth,
      height: 22,
      backgroundColor: colors.borderSoft,
      flexShrink: 0,
    },
    searchPlaceholder: {
      ...typography.secondary,
      fontSize: 14,
      color: colors.textMuted,
    },
  });
}

export default MarketAppBar;
