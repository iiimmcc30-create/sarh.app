import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { AppText } from '@/design-system/components';
import { butcherMarket } from '@/constants/butcherMarket';
import { butcherTypography } from '@/constants/butcherTypography';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow } from '@/lib/rtl';
import { cloudinaryFitUrl } from '@/lib/listingMedia';
import type { ButcherProduct } from '@/services/butcherData';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const IMAGE_SIZE = 92;
const ADD_SIZE = 34;

type ButcherStoreProductCardProps = {
  product: ButcherProduct;
  currencySymbol: string;
  onPress: () => void;
  onAdd: () => void;
  showDivider?: boolean;
};

function unitLabel(product: ButcherProduct): string {
  if (product.pricePerKg != null) {
    const kg = product.weightRange?.min ?? 1;
    return `${kg} كيلو غرام`;
  }
  return '1 قطعة';
}

export function ButcherStoreProductCard({
  product,
  currencySymbol,
  onPress,
  onAdd,
  showDivider = true,
}: ButcherStoreProductCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const currentPrice = product.pricePerKg ?? product.priceFixed ?? 0;
  const comparePrice =
    product.pricePerKg && product.priceFixed && product.priceFixed > product.pricePerKg
      ? product.priceFixed
      : null;
  const discount =
    comparePrice && currentPrice
      ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
      : 0;
  const description =
    product.descriptionAr?.trim() ||
    product.pricingNoteAr?.trim() ||
    product.description?.trim() ||
    '';
  const imageUri = cloudinaryFitUrl(product.images[0], 'row');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.rowWrap, !showDivider && styles.rowLast, pressed && { opacity: 0.96 }]}
    >
      <View style={[styles.row, getRtlRow()]}>
        <View style={styles.imageWrap}>
          {imageUri ? (
            <Image source={uriSource(imageUri)} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.imageFallback} />
          )}
        </View>

        <View style={styles.body}>
          <AppText variant="label" numberOfLines={2}>
            {product.nameAr}
          </AppText>
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {unitLabel(product)}
            {description ? ` · ${description}` : ''}
          </AppText>
          <View style={[styles.priceRow, getRtlRow()]}>
            <Text style={styles.price}>
              {currentPrice.toLocaleString('en-US')} {currencySymbol}
            </Text>
            {comparePrice ? (
              <Text style={styles.compare}>
                {comparePrice.toLocaleString('en-US')} {currencySymbol}
              </Text>
            ) : null}
            {discount > 0 ? (
              <View style={styles.discount}>
                <Text style={styles.discountText}>-{discount}%</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onAdd();
          }}
          style={styles.addBtn}
          hitSlop={6}
          accessibilityLabel="إضافة للسلة"
        >
          <AppIcon name="cart-outline" size={16} color={butcherMarket.seeAll} />
          <View style={styles.plusDot}>
            <AppIcon name="plus" size={9} color="#fff" />
          </View>
        </Pressable>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    rowWrap: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
      backgroundColor: 'transparent',
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    row: {
      alignItems: 'center',
      gap: 12,
    },
    imageWrap: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      flexShrink: 0,
    },
    image: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      borderRadius: radius.md,
      backgroundColor: colors.bgSurface,
    },
    imageFallback: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      borderRadius: radius.md,
      backgroundColor: colors.bgSurface,
    },
    addBtn: {
      width: ADD_SIZE,
      height: ADD_SIZE,
      borderRadius: 8,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: butcherMarket.seeAll,
    },
    plusDot: {
      position: 'absolute',
      top: -3,
      end: -3,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: butcherMarket.seeAll,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    priceRow: {
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    price: {
      ...butcherTypography.title,
      color: butcherMarket.seeAll,
    },
    compare: {
      ...butcherTypography.meta,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    discount: {
      backgroundColor: butcherMarket.seeAll,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.pill,
    },
    discountText: {
      ...butcherTypography.badge,
      color: '#fff',
    },
  });
}
