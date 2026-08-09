import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow, getRtlText } from '@/lib/rtl';
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
  onBuyNow: () => void;
};

export function ButcherStoreProductCard({
  product,
  currencySymbol,
  onPress,
  onAdd,
  onBuyNow,
}: ButcherStoreProductCardProps) {
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const cat = CATEGORY_LABELS[product.category as MeatCategory];
  const priceLabel = product.pricePerKg
    ? `${product.pricePerKg} ${currencySymbol}/كغ`
    : `${(product.priceFixed ?? 0).toLocaleString('en-US')} ${currencySymbol}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}
    >
      <Image
        source={{ uri: resolveMediaUrl(product.images[0]) ?? PLACEHOLDER }}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {product.nameAr}
        </Text>
        {product.descriptionAr ? (
          <Text style={styles.desc} numberOfLines={2}>
            {product.descriptionAr}
          </Text>
        ) : null}
        <Text style={styles.cat}>
          {cat?.icon} {cat?.ar}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{priceLabel}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onBuyNow();
              }}
              style={styles.buyNowBtn}
              hitSlop={6}
            >
              <Text style={styles.buyNowText}>الآن</Text>
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onAdd();
              }}
              style={styles.addBtn}
              hitSlop={6}
            >
              <AppIcon name="add" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      ...getRtlRow(),
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    image: {
      width: 108,
      height: 108,
    },
    body: {
      flex: 1,
      padding: spacing.md,
      gap: 4,
      justifyContent: 'center',
    },
    name: {
      ...typography.bodyStrong,
      ...getRtlText(),
      color: colors.textPrimary,
    },
    desc: {
      ...typography.caption,
      ...getRtlText(),
      color: colors.textMuted,
      lineHeight: 18,
    },
    cat: {
      ...typography.micro,
      ...getRtlText(),
      color: colors.textSecondary,
    },
    footer: {
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    price: {
      ...typography.bodyStrong,
      ...getRtlText(),
      color: colors.textPrimary,
    },
    actions: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: spacing.xs,
    },
    buyNowBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    buyNowText: {
      ...typography.micro,
      ...getRtlText(),
      color: colors.textSecondary,
      fontWeight: '700',
    },
    addBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
