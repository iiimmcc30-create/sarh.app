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
  onFeaturedPress: () => void;
  featuredActive?: boolean;
  searchPlaceholder?: string;
};

/** Market header: filter inside full-width search bar (physical left), featured star inside right. */
export function MarketAppBar({
  onSearch,
  onFilterPress,
  onFeaturedPress,
  featuredActive = false,
  searchPlaceholder = 'ابحث في السوق',
}: Props) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  return (
    <View style={styles.shell}>
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, getRtlRow()]}>
          <Pressable
            onPress={onFilterPress}
            style={styles.inlineToolBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="تصفية"
          >
            <AppIcon name="settings-sliders" size={TOOL_ICON} color={colors.textPrimary} />
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

          <View style={styles.searchDivider} />

          <Pressable
            onPress={onFeaturedPress}
            style={[styles.inlineToolBtn, featuredActive && styles.inlineToolBtnActive]}
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
    searchRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    searchBar: {
      width: '100%',
      height: SEARCH_H,
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
      backgroundColor: colors.bgElevated,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    inlineToolBtn: {
      width: TOOL_H,
      height: TOOL_H,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderRadius: 8,
      flexShrink: 0,
    },
    inlineToolBtnActive: {
      backgroundColor: `${colors.gold}14`,
    },
    searchDivider: {
      width: StyleSheet.hairlineWidth,
      height: 22,
      backgroundColor: colors.borderSoft,
      marginHorizontal: 4,
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
    searchPlaceholder: {
      ...typography.secondary,
      fontSize: 14,
      color: colors.textMuted,
    },
  });
}

export default MarketAppBar;
