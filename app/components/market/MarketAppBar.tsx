import { AppIcon } from '@/components/ui/FlaticonIcon';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, View } from 'react-native';

const SEARCH_H = 44;
const TOOL_H = 40;
const TOOL_ICON = 18;
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

/** Top chrome: filter + sort (separate) · search (flex) · featured star. */
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
        <View style={styles.toolPair}>
          <Pressable
            onPress={onFilterPress}
            style={styles.toolBtn}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="تصفية"
          >
            <AppIcon name="settings-sliders" size={TOOL_ICON} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            onPress={onSortPress}
            style={styles.toolBtn}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={sortLabel}
          >
            <AppIcon name="sort-alt" size={TOOL_ICON} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Pressable
          onPress={onSearch}
          style={[styles.searchPill, getRtlRow()]}
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

        <Pressable
          onPress={onFeaturedPress}
          style={[styles.toolBtn, featuredActive && styles.toolBtnActive]}
          hitSlop={6}
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
    bar: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 56,
      gap: spacing.sm,
    },
    toolPair: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: 6,
      flexGrow: 0,
      flexShrink: 0,
    },
    toolBtn: {
      width: TOOL_H,
      height: TOOL_H,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
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
      gap: 6,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.bgElevated,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    searchPlaceholder: {
      ...typography.secondary,
      fontSize: 14,
      color: colors.textMuted,
    },
  });
}

export default MarketAppBar;
