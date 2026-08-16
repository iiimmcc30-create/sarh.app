import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { butcherTypography } from '@/constants/butcherTypography';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { resolveMediaUrl } from '@/services/media';
import type { ButcherProduct, MeatCategory } from '@/services/butcherData';
import { CATEGORY_LABELS } from '@/services/butcherData';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80';

type ButcherStoreProductCardProps = {
  product: ButcherProduct;
  currencySymbol: string;
  onPress: () => void;
  onAdd: () => void;
};

export function ButcherStoreProductCard({
  product,
  currencySymbol,
  onPress,
  onAdd,
}: ButcherStoreProductCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const cat = CATEGORY_LABELS[product.category as MeatCategory];
  const qtyLabel = product.pricePerKg
    ? product.weightRange
      ? `${product.weightRange.min}–${product.weightRange.max} كغ`
      : '1 كيلو غرام'
    : '1 قطعة';
  const currentPrice = product.pricePerKg ?? product.priceFixed ?? 0;
  const comparePrice =
    product.pricePerKg && product.priceFixed && product.priceFixed > product.pricePerKg
      ? product.priceFixed
      : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}
    >
      <View style={styles.coverTrail}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onAdd();
          }}
          style={styles.addBtn}
          hitSlop={6}
          accessibilityLabel="إضافة للسلة"
        >
          <AppIcon name="add" size={16} color="#fff" />
          <AppIcon name="cart-outline" size={14} color="#fff" />
        </Pressable>

        <View style={styles.body}>
          <View style={styles.rtlTextShell}>
            <Text style={styles.name} numberOfLines={2}>
              {product.nameAr}
            </Text>
          </View>
          <View style={styles.rtlTextShell}>
            <Text style={styles.qty}>{qtyLabel}</Text>
          </View>
          {cat ? (
            <View style={styles.rtlTextShell}>
              <Text style={styles.cat}>{cat.ar}</Text>
            </View>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {currentPrice.toLocaleString('en-US')} {currencySymbol}
            </Text>
            {comparePrice ? (
              <Text style={styles.compare}>
                {comparePrice.toLocaleString('en-US')} {currencySymbol}
              </Text>
            ) : null}
          </View>
        </View>

        <Image
          source={{ uri: resolveMediaUrl(product.images[0]) ?? PLACEHOLDER }}
          style={styles.image}
          contentFit="cover"
        />
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSoft,
      backgroundColor: colors.screenRoot,
    },
    coverTrail: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 12,
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 1,
      flexShrink: 0,
    },
    body: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
      gap: 3,
    },
    rtlTextShell: {
      width: '100%',
      direction: 'ltr',
    },
    name: {
      ...typography.cardHeading,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    qty: {
      ...butcherTypography.secondary,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    cat: {
      ...butcherTypography.meta,
      color: colors.textSecondary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    priceRow: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'baseline',
      gap: 8,
      marginTop: 4,
    },
    price: {
      ...typography.value,
      color: colors.electricBright,
    },
    compare: {
      ...butcherTypography.secondary,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    image: {
      width: 88,
      height: 88,
      borderRadius: 12,
      backgroundColor: colors.bgElevated,
      flexShrink: 0,
    },
  });
}
