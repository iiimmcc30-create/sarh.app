import type { RegionSelection } from '@/constants/saudiRegions';
import { regionSelectionLabel } from '@/lib/saudiRegionSearch';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { FilterChip, FilterChipRow, MARKET_CHIP } from '@/components/ui/FilterChip';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  regionSelection: RegionSelection;
  onRegionPress: () => void;
  onNearbyPress: () => void;
  onSortPress: () => void;
  onCategoryPress: () => void;
  categoryActive?: boolean;
  categoryPickerOpen?: boolean;
  regionActive?: boolean;
};

/** Region + nearby chips, then paired sort/category bar (reference layout). */
export function MarketFilterBar({
  regionSelection,
  onRegionPress,
  onNearbyPress,
  onSortPress,
  onCategoryPress,
  categoryActive = false,
  categoryPickerOpen = false,
  regionActive = false,
}: Props) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  const regionOpen = regionActive || regionSelection.type !== 'all';
  const regionLabel = regionSelectionLabel(regionSelection);
  const categoryOpen = categoryPickerOpen || categoryActive;
  const accent = colors.electricBright;

  return (
    <View style={styles.wrap}>
      <FilterChipRow contentPaddingHorizontal={spacing.md}>
        <Pressable
          style={[
            styles.regionBtn,
            regionOpen && styles.regionBtnActive,
            getRtlRow(),
          ]}
          onPress={onRegionPress}
          accessibilityRole="button"
          accessibilityLabel={regionLabel}
        >
          <AppIcon
            name="map-marker-outline"
            size={MARKET_CHIP.iconSize}
            color={regionOpen ? accent : colors.textPrimary}
          />
          <Text
            style={[styles.regionText, regionOpen && styles.regionTextActive]}
            numberOfLines={1}
          >
            {regionLabel}
          </Text>
          <AppIcon
            name="angle-down"
            size={11}
            color={regionOpen ? accent : colors.textSecondary}
          />
        </Pressable>

        <FilterChip label="القريب" icon="navigation" compact onPress={onNearbyPress} />

        <View style={[styles.sortCategoryBar, getRtlRow()]}>
          <Pressable
            style={[styles.sortCategoryHalf, getRtlRow()]}
            onPress={onSortPress}
            accessibilityRole="button"
            accessibilityLabel="الترتيب"
            testID="market-sort-chip"
          >
            <AppIcon name="sort-alt" size={16} color={accent} />
            <Text style={styles.sortCategoryLabel}>الترتيب</Text>
          </Pressable>

          <View style={styles.sortCategoryDivider} />

          <Pressable
            style={[styles.sortCategoryHalf, getRtlRow()]}
            onPress={onCategoryPress}
            accessibilityRole="button"
            accessibilityLabel="التصنيف"
            testID="market-category-chip"
          >
            <AppIcon name="options-outline" size={16} color={accent} />
            <Text
              style={[
                styles.sortCategoryLabel,
                categoryOpen && styles.sortCategoryLabelActive,
              ]}
            >
              التصنيف
            </Text>
          </Pressable>
        </View>
      </FilterChipRow>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexGrow: 0,
      flexShrink: 0,
      paddingVertical: spacing.xs,
    },
    regionBtn: {
      height: MARKET_CHIP.height,
      flexDirection: 'row',
      alignItems: 'center',
      gap: MARKET_CHIP.gap,
      paddingHorizontal: MARKET_CHIP.paddingHorizontal,
      borderRadius: MARKET_CHIP.radius,
      backgroundColor: colors.bgElevated,
      borderWidth: 0,
      maxWidth: 160,
      flexShrink: 0,
    },
    regionBtnActive: {
      borderWidth: 1,
      borderColor: colors.electricBright,
      backgroundColor: `${colors.electricBright}14`,
    },
    regionText: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      fontSize: MARKET_CHIP.fontSize,
      lineHeight: MARKET_CHIP.lineHeight,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      flexShrink: 1,
      includeFontPadding: false,
    },
    regionTextActive: {
      color: colors.electricBright,
    },
    sortCategoryBar: {
      flex: 1,
      minWidth: 0,
      height: MARKET_CHIP.height,
      alignItems: 'stretch',
      backgroundColor: colors.bgElevated,
      borderRadius: MARKET_CHIP.radius,
      overflow: 'hidden',
    },
    sortCategoryHalf: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm,
    },
    sortCategoryDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: 'stretch',
      backgroundColor: colors.borderSoft,
      marginVertical: 8,
    },
    sortCategoryLabel: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      fontSize: MARKET_CHIP.fontSize,
      lineHeight: MARKET_CHIP.lineHeight,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    sortCategoryLabelActive: {
      color: colors.electricBright,
      fontWeight: '600',
    },
  });
}

export default MarketFilterBar;
