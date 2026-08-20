import { AppIcon } from '@/components/ui/FlaticonIcon';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, View } from 'react-native';

const BAR_H = 44;
const ICON = 16;
const SLOT = 36;

type Props = {
  onSearch: () => void;
  onFilterPress: () => void;
  onSortPress: () => void;
  onFeaturedPress: () => void;
  featuredActive?: boolean;
  searchPlaceholder?: string;
  sortLabel?: string;
};

/** One market search track: filter · sort · search (flex) · featured. */
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
      <View style={styles.track}>
        <Pressable
          onPress={onFilterPress}
          style={styles.iconSlot}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="تصفية"
        >
          <AppIcon name="settings-sliders" size={ICON} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          onPress={onSortPress}
          style={styles.iconSlot}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={sortLabel}
        >
          <AppIcon name="sort-alt" size={ICON} color={colors.textPrimary} />
        </Pressable>

        <Pressable
          onPress={onSearch}
          style={[styles.searchSlot, getRtlRow()]}
          accessibilityRole="search"
          accessibilityLabel={searchPlaceholder}
        >
          <AppIcon name="search" size={ICON} color={colors.textMuted} />
          <RtlTextShell flex>
            <RtlText style={styles.searchPlaceholder} numberOfLines={1}>
              {searchPlaceholder}
            </RtlText>
          </RtlTextShell>
        </Pressable>

        <Pressable
          onPress={onFeaturedPress}
          style={styles.iconSlot}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="الإعلانات المميزة"
          accessibilityState={{ selected: featuredActive }}
        >
          <AppIcon
            name="star"
            size={ICON}
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
    track: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      height: BAR_H,
      marginHorizontal: spacing.md,
      marginVertical: spacing.sm,
      paddingHorizontal: 4,
      backgroundColor: colors.bgElevated,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    iconSlot: {
      width: SLOT,
      height: BAR_H,
      flexGrow: 0,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchSlot: {
      flex: 1,
      minWidth: 0,
      height: BAR_H,
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 6,
    },
    searchPlaceholder: {
      ...typography.secondary,
      fontSize: 14,
      color: colors.textMuted,
    },
  });
}

export default MarketAppBar;
