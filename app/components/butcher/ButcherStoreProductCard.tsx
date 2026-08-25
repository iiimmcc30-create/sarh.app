import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { butcherTypography } from '@/constants/butcherTypography';
import { spacing, typography, type ThemeColors } from '@/constants/theme';import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { resolveMediaUrl } from '@/services/media';
import type { ButcherProduct } from '@/services/butcherData';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80';

/** Reference menu card: ~104px square image, text on the right, + under image. */
const IMAGE_SIZE = 104;
const ADD_SIZE = 36;

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

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}
    >
      {/* Physical LTR: image column (left) · details (right) — matches reference */}
      <View style={styles.row}>
        <View style={styles.mediaCol}>
          <Image
            source={{ uri: resolveMediaUrl(product.images[0]) ?? PLACEHOLDER }}
            style={styles.image}
            contentFit="cover"
          />
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onAdd();
            }}
            style={styles.addBtn}
            hitSlop={6}
            accessibilityLabel="إضافة للسلة"
          >
            <AppIcon name="add" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>
            {product.nameAr}
          </Text>
          {description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            {product.freshness ? (
              <View style={styles.metaItem}>
                <AppIcon name="information-circle-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {product.freshness === 'frozen' ? 'مجمّد' : 'طازج'}
                </Text>
              </View>
            ) : null}
            {product.weightRange ? (
              <View style={styles.metaItem}>
                <AppIcon name="scale" size={13} color={colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {product.weightRange.min}–{product.weightRange.max} كغ
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {currencySymbol} {currentPrice.toLocaleString('en-US')}
            </Text>
            {comparePrice ? (
              <Text style={styles.compare}>
                {currencySymbol} {comparePrice.toLocaleString('en-US')}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSoft,
      backgroundColor: colors.screenRoot,
    },
    row: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'flex-start',
      gap: 14,
    },
    mediaCol: {
      width: IMAGE_SIZE,
      flexShrink: 0,
      alignItems: 'flex-start',
      gap: 8,
    },
    image: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
    },
    addBtn: {
      width: ADD_SIZE,
      height: ADD_SIZE,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderMid,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
      minWidth: 0,
      minHeight: IMAGE_SIZE,
      justifyContent: 'space-between',
      gap: 6,
      paddingTop: 2,
    },
    name: {
      ...typography.cardHeading,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      width: '100%',
    },
    desc: {
      ...butcherTypography.secondary,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
      width: '100%',
      lineHeight: 20,
    },
    metaRow: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 2,
    },
    metaItem: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      ...butcherTypography.meta,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
    priceRow: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'baseline',
      gap: 8,
      paddingTop: 4,
    },
    price: {
      ...typography.value,
      color: colors.textPrimary,
    },
    compare: {
      ...butcherTypography.secondary,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
  });
}
