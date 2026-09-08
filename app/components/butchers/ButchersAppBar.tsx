import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ButcherLocationBar } from '@/components/butchers/ButcherLocationBar';
import { butcherTypography } from '@/constants/butcherTypography';
import { ds } from '@/constants/designSystem';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow, rtlBackIcon } from '@/lib/rtl';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type ButchersAppBarProps = {
  onBack: () => void;
  onCart: () => void;
  cartCount?: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
};

/** Butchers market header — location cluster + bare search/cart/back icons. */
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
  const [searchOpen, setSearchOpen] = useState(false);
  const showField = searchOpen || searchQuery.length > 0;

  return (
    <View style={styles.shell}>
      <View style={[styles.bar, getRtlRow()]}>
        {showField ? (
          <View style={[styles.searchField, getRtlRow()]}>
            <AppIcon name="search" size={ds.icon.sm} color={colors.textPrimary} />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={onSearchChange}
              autoFocus={searchOpen && searchQuery.length === 0}
              returnKeyType="search"
              accessibilityLabel={searchPlaceholder}
            />
            <Pressable
              onPress={() => {
                onSearchChange('');
                setSearchOpen(false);
              }}
              hitSlop={8}
              accessibilityLabel="مسح البحث"
            >
              <AppIcon name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : (
          <ButcherLocationBar compact />
        )}

        <View style={[styles.actions, getRtlRow()]}>
          <Pressable onPress={onCart} style={styles.iconBtn} hitSlop={8} accessibilityLabel="السلة">
            <AppIcon name="cart-outline" size={ds.icon.md} color={colors.textPrimary} />
            {cartCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            ) : null}
          </Pressable>
          {!showField ? (
            <Pressable
              onPress={() => setSearchOpen(true)}
              style={styles.iconBtn}
              hitSlop={8}
              accessibilityLabel="بحث"
            >
              <AppIcon name="search" size={ds.icon.md} color={colors.textPrimary} />
            </Pressable>
          ) : null}
          <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={8} accessibilityLabel="رجوع للتطبيق">
            <AppIcon name={rtlBackIcon()} size={ds.icon.md} color={colors.textPrimary} />
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
    },
    bar: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 56,
      gap: spacing.sm,
    },
    searchField: {
      flex: 1,
      minHeight: 40,
      alignItems: 'center',
      gap: spacing.sm,
    },
    searchInput: {
      ...butcherTypography.secondary,
      color: colors.textPrimary,
      flex: 1,
      paddingVertical: 0,
    },
    actions: {
      alignItems: 'center',
      flexShrink: 0,
      gap: 2,
    },
    iconBtn: {
      width: ds.iconBtn.md,
      height: ds.iconBtn.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: 4,
      start: 4,
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
      color: colors.bgDeep,
    },
  });
}

export default ButchersAppBar;
