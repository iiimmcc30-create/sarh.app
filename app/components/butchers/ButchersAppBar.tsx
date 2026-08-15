import { AppIcon } from '@/components/ui/FlaticonIcon';
import { MENU_CARD } from '@/components/feature/SidebarMenu';
import { butcherTypography } from '@/constants/butcherTypography';
import { ds } from '@/constants/designSystem';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow, rtlBackIcon } from '@/lib/rtl';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

type ButchersAppBarProps = {
  onBack: () => void;
  onCart: () => void;
  cartCount?: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
};

/** Butchers header — back to main app · search · cart. */
export function ButchersAppBar({
  onBack,
  onCart,
  cartCount = 0,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'ابحث عن ملحمة، مدينة، أو نوع لحم...',
}: ButchersAppBarProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  return (
    <View style={styles.shell}>
      <View style={[styles.bar, getRtlRow()]}>
        <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={8} accessibilityLabel="رجوع للتطبيق">
          <AppIcon name={rtlBackIcon()} size={ds.icon.md} color={colors.textPrimary} />
        </Pressable>

        <View style={[styles.searchPill, getRtlRow()]}>
          <AppIcon name="search" size={ds.icon.sm} color={colors.textPrimary} />
          <RtlTextShell>
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={onSearchChange}
              textAlign="right"
              returnKeyType="search"
              accessibilityLabel={searchPlaceholder}
            />
          </RtlTextShell>
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => onSearchChange('')} hitSlop={8} accessibilityLabel="مسح البحث">
              <AppIcon name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable onPress={onCart} style={styles.iconBtn} hitSlop={8} accessibilityLabel="السلة">
          <AppIcon name="cart-outline" size={ds.icon.md} color={colors.textPrimary} />
          {cartCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    shell: {
      backgroundColor: colors.bgElevated,
      borderBottomWidth: 0,
      flexGrow: 0,
      flexShrink: 0,
    },
    bar: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 52,
      gap: spacing.sm,
    },
    searchPill: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.bgDeep,
      borderRadius: MENU_CARD.controlRadius,
      borderWidth: 0,
    },
    searchInput: {
      ...butcherTypography.body,
      color: colors.textPrimary,
      fontSize: 14,
      paddingVertical: 0,
    },
    iconBtn: {
      width: ds.iconBtn.md,
      height: ds.iconBtn.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgDeep,
      borderRadius: 12,
      borderWidth: 0,
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: 4,
      left: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      ...butcherTypography.badge,
      color: '#fff',
    },
  });
}

export default ButchersAppBar;
