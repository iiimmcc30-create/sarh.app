import { AppIcon } from '@/components/ui/FlaticonIcon';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ButcherStickyCartBarProps = {
  itemCount: number;
  subtotal: number;
  currencySymbol: string;
  onPress: () => void;
};

export function ButcherStickyCartBar({
  itemCount,
  subtotal,
  currencySymbol,
  onPress,
}: ButcherStickyCartBarProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  if (itemCount <= 0) return null;

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + spacing.sm }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.bar, pressed && { opacity: 0.94 }]}
      >
        <View style={styles.left}>
          <View style={styles.badge}>
            <AppIcon name="cart-outline" size={16} color="#fff" />
            <Text style={styles.badgeText}>{itemCount}</Text>
          </View>
          <Text style={styles.summary}>
            {itemCount} {itemCount === 1 ? 'منتج' : 'منتجات'}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.total}>
            {subtotal.toLocaleString('en-US')} {currencySymbol}
          </Text>
          <Text style={styles.cta}>عرض السلة</Text>
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      bottom: 0,
    },
    bar: {
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.electric,
      borderRadius: radius.pill,
      paddingVertical: 12,
      paddingHorizontal: spacing.lg,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    left: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: spacing.sm,
    },
    badge: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    badgeText: {
      ...typography.micro,
      color: '#fff',
      fontWeight: '600',
    },
    summary: {
      ...typography.bodyStrong,
      writingDirection: 'rtl', textAlign: 'right', color: '#fff',
    },
    right: {
      alignItems: 'flex-end',
      gap: 2,
    },
    total: {
      ...typography.bodyStrong,
      writingDirection: 'rtl', textAlign: 'right', color: '#fff',
    },
    cta: {
      ...typography.micro,
      writingDirection: 'rtl', textAlign: 'right', color: 'rgba(255,255,255,0.9)',
      fontWeight: '600',
    },
  });
}
