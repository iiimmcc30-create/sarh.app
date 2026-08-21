import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, View } from 'react-native';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

const SEARCH_H = 44;
const TOOL_H = 32;
const TOOL_ICON = 16;
const SEARCH_ICON = 16;

type HomeAppBarProps = {
  onMore: () => void;
  onSearch: () => void;
  searchPlaceholder?: string;
};

/** Home header: full-width search bar; more + notifications pinned physical left inside. */
export function HomeAppBar({
  onMore,
  onSearch,
  searchPlaceholder = 'ابحث في سرح',
}: HomeAppBarProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  return (
    <View style={styles.shell}>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <View style={styles.iconPair}>
            <Pressable
              onPress={onMore}
              style={styles.inlineIconBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="المزيد"
            >
              <AppIcon name="more-vertical" size={TOOL_ICON} color={colors.textPrimary} />
            </Pressable>

            <NotificationBellButton
              size={TOOL_H}
              iconSize={TOOL_ICON}
              style={styles.inlineIconBtn}
              iconColor={colors.textPrimary}
              badgeBorderColor={colors.bgElevated}
            />
          </View>

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
      paddingBottom: spacing.xs,
    },
    searchRow: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    searchBar: {
      width: '100%',
      height: SEARCH_H,
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
      backgroundColor: colors.bgElevated,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    iconPair: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: 2,
      flexGrow: 0,
      flexShrink: 0,
    },
    inlineIconBtn: {
      width: TOOL_H,
      height: TOOL_H,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 0,
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

export default HomeAppBar;
