import type { RegionSelection } from '@/constants/saudiRegions';
import { regionSelectionLabel } from '@/lib/saudiRegionSearch';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { FilterChip, FilterChipRow } from '@/components/ui/FilterChip';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  regionSelection: RegionSelection;
  onRegionPress: () => void;
  onFilterPress: () => void;
  onNearbyPress: () => void;
  onSortPress: () => void;
  sortLabel?: string;
  filterActive?: boolean;
};

export function MarketFilterBar({
  regionSelection,
  onRegionPress,
  onFilterPress,
  onNearbyPress,
  onSortPress,
  sortLabel = 'الأحدث',
  filterActive = false,
}: Props) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  return (
    <View style={styles.wrap}>
      <FilterChipRow contentPaddingHorizontal={spacing.md}>
        <Pressable style={[styles.regionBtn, getRtlRow()]} onPress={onRegionPress}>
          <Text style={styles.regionText} numberOfLines={1}>
            {regionSelectionLabel(regionSelection)}
          </Text>
          <AppIcon name="angle-down" size={14} color={colors.textSecondary} />
        </Pressable>

        <FilterChip
          label="تصفية"
          selected={filterActive}
          onPress={onFilterPress}
        />
        <FilterChip label="القريب" onPress={onNearbyPress} />
        <FilterChip label={sortLabel} onPress={onSortPress} />
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
      height: 46,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 22,
      borderRadius: 15,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      maxWidth: 160,
      flexShrink: 0,
    },
    regionText: {
      ...typography.caption,
      fontSize: 14,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      flexShrink: 1,
    },
  });
}

export default MarketFilterBar;
