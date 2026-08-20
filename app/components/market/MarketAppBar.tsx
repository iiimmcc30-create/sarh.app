import { AppIcon } from '@/components/ui/FlaticonIcon';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, View } from 'react-native';

const SEARCH_HEIGHT = 48;

type Props = {
  onSearch: () => void;
  searchPlaceholder?: string;
};

/** Market header is search-only — no more / notifications chrome. */
export function MarketAppBar({
  onSearch,
  searchPlaceholder = 'ابحث في السوق',
}: Props) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  return (
    <View style={styles.shell}>
      <View style={styles.bar}>
        <Pressable
          onPress={onSearch}
          style={[styles.searchPill, getRtlRow()]}
          accessibilityRole="search"
          accessibilityLabel={searchPlaceholder}
        >
          <AppIcon name="search" size={22} color={colors.textMuted} />
          <RtlTextShell>
            <RtlText style={styles.searchPlaceholder} numberOfLines={1}>
              {searchPlaceholder}
            </RtlText>
          </RtlTextShell>
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
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 56,
      justifyContent: 'center',
    },
    searchPill: {
      flex: 1,
      height: SEARCH_HEIGHT,
      minHeight: SEARCH_HEIGHT,
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
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
