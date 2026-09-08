import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { AppText } from '@/design-system/components';
import { butcherTypography } from '@/constants/butcherTypography';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow } from '@/lib/rtl';
import { resolveMediaUrl } from '@/services/media';
import type { ButcherProduct } from '@/services/butcherData';
import { Pressable, StyleSheet, View } from 'react-native';

const IMAGE_SIZE = 88;
const ADD_SIZE = 36;

type ButcherStoreProductCardProps = {
  product: ButcherProduct;
  currencySymbol: string;
  onPress: () => void;
  onAdd: () => void;
  showDivider?: boolean;
};

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
  const description =
    product.descriptionAr?.trim() ||
    product.pricingNoteAr?.trim() ||
    product.description?.trim() ||
    '';
  const imageUri = resolveMediaUrl(product.images[0]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.rowWrap, !showDivider && styles.rowLast, pressed && { opacity: 0.96 }]}
    >
      <View style={[styles.row, getRtlRow()]}>
        <View style={styles.imageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.imageFallback} />
          )}
        </View>

        <View style={styles.body}>
          <AppText variant="label" numberOfLines={2}>
            {product.nameAr}
          </AppText>
          {description ? (
            <AppText variant="caption" color="textMuted" numberOfLines={2}>
              {description}
            </AppText>
          ) : null}
          <AppText variant="label" color="primary">
            {currentPrice.toLocaleString('en-US')} {currencySymbol}
          </AppText>
          {comparePrice ? (
            <AppText variant="caption" color="textMuted" style={styles.compare}>
              {comparePrice.toLocaleString('en-US')} {currencySymbol}
            </AppText>
          ) : null}
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
          <AppIcon name="add" size={20} color={colors.bgDeep} />
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
      gap: 14,
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
      borderRadius: ADD_SIZE / 2,
      backgroundColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    compare: {
      ...butcherTypography.meta,
      textDecorationLine: 'line-through',
    },
  });
}
