import type { RegionSelection } from '@/constants/saudiRegions';
import { regionSelectionLabel } from '@/lib/saudiRegionSearch';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { FilterChip, FilterChipRow, FILTER_CHIP, MARKET_CHIP } from '@/components/ui/FilterChip';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  regionSelection: RegionSelection;
  onRegionPress: () => void;
  onNearbyPress: () => void;
  onSortPress: () => void;
  sortLabel: string;
  regionActive?: boolean;
};

export function MarketFilterBar({
  regionSelection,
  onRegionPress,
  onNearbyPress,
  onSortPress,
  sortLabel,
  regionActive = false,
}: Props) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  const regionOpen = regionActive || regionSelection.type !== 'all';
  const regionLabel = regionSelectionLabel(regionSelection);

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
            color={regionOpen ? colors.electricBright : colors.textPrimary}
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
            color={regionOpen ? colors.electricBright : colors.textSecondary}
          />
        </Pressable>

        <FilterChip label="القريب" icon="navigation" compact onPress={onNearbyPress} />
        <FilterChip
          label={sortLabel}
          icon="sort-alt"
          compact
          onPress={onSortPress}
          testID="market-sort-chip"
        />
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
      backgroundColor: colors.bgSurface || FILTER_CHIP.idleSurfaceFallback,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      maxWidth: 160,
      flexShrink: 0,
    },
    regionBtnActive: {
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
  });
}

export default MarketFilterBar;
