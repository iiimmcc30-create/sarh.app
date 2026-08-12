import { AppIcon } from '@/components/ui/FlaticonIcon';
import type { RegionSelection } from '@/constants/saudiRegions';
import { regionSelectionLabel } from '@/lib/saudiRegionSearch';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
      <ScrollView
        horizontal
        style={styles.hScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, getRtlRow()]}
      >
        <Pressable style={[styles.regionBtn, getRtlRow()]} onPress={onRegionPress}>
          <Text style={styles.regionText} numberOfLines={1}>
            {regionSelectionLabel(regionSelection)}
          </Text>
          <AppIcon name="angle-down" size={14} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.chip, getRtlRow(), filterActive && styles.chipActive]}
          onPress={onFilterPress}
        >
          <AppIcon
            name="settings-sliders"
            size={14}
            color={filterActive ? '#fff' : colors.textSecondary}
          />
          <Text style={[styles.chipText, filterActive && styles.chipTextActive]}>تصفية</Text>
        </Pressable>

        <Pressable style={[styles.chip, getRtlRow()]} onPress={onNearbyPress}>
          <AppIcon name="map-marker-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.chipText}>القريب</Text>
        </Pressable>

        <Pressable style={[styles.chip, getRtlRow()]} onPress={onSortPress}>
          <Text style={styles.chipText}>{sortLabel}</Text>
          <AppIcon name="sort-alt" size={14} color={colors.textSecondary} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexGrow: 0,
      flexShrink: 0,
    },
    /** Prevent RN Web ScrollView default flexGrow:1 from opening a vertical gap. */
    hScroll: {
      flexGrow: 0,
      flexShrink: 0,
    },
    row: {
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    regionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      minHeight: 38,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
      maxWidth: 160,
    },
    regionText: {
      ...typography.caption,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      writingDirection: 'rtl',
      flexShrink: 1,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      minHeight: 38,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
    },
    chipActive: {
      backgroundColor: colors.electric,
    },
    chipText: {
      ...typography.caption,
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      writingDirection: 'rtl',
    },
    chipTextActive: {
      color: '#fff',
    },
  });
}

export default MarketFilterBar;
