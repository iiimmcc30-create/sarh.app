import type { RegionSelection } from '@/constants/saudiRegions';
import { regionSelectionLabel } from '@/lib/saudiRegionSearch';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { FilterChip, FilterChipRow, FILTER_CHIP } from '@/components/ui/FilterChip';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  regionSelection: RegionSelection;
  onRegionPress: () => void;
  onNearbyPress: () => void;
  regionActive?: boolean;
};

export function MarketFilterBar({
  regionSelection,
  onRegionPress,
  onNearbyPress,
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
            size={15}
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
            size={13}
            color={regionOpen ? colors.electricBright : colors.textSecondary}
          />
        </Pressable>

        <FilterChip label="القريب" icon="navigation" onPress={onNearbyPress} />
      </FilterChipRow>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexGrow: 0,
      flexShrink: 0,
      paddingVertical: spacing.sm,
    },
    regionBtn: {
      height: FILTER_CHIP.height,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: FILTER_CHIP.paddingHorizontal,
      borderRadius: FILTER_CHIP.radius,
      backgroundColor: colors.bgSurface || FILTER_CHIP.idleSurfaceFallback,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      maxWidth: 180,
      flexShrink: 0,
    },
    regionBtnActive: {
      borderColor: colors.electricBright,
      backgroundColor: `${colors.electricBright}14`,
    },
    regionText: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      fontSize: 14,
      lineHeight: 20,
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
