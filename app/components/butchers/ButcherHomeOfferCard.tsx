import { Image, uriSource } from '@/components/ui/AppImage';
import { AppText } from '@/design-system/components';
import { butcherTypography } from '@/constants/butcherTypography';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ButcherOfferPreview } from '@/services/butcherOffersPreview';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  offer: ButcherOfferPreview;
  width: number;
  onPress: () => void;
};

export function ButcherHomeOfferCard({ offer, width, onPress }: Props) {
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const hasCompare =
    offer.originalPrice != null &&
    offer.offerPrice != null &&
    offer.originalPrice !== offer.offerPrice;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, { width }, pressed && { opacity: 0.94 }]}
      accessibilityRole="button"
      accessibilityLabel={offer.titleAr}
    >
      <View style={styles.imageWrap}>
        <Image source={uriSource(offer.image)} style={styles.image} contentFit="cover" />
        {offer.discountPercent ? (
          <View style={styles.discount}>
            <AppText variant="micro" color="textPrimary" style={styles.discountText}>
              -{offer.discountPercent}%
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="label" numberOfLines={2} style={styles.name}>
        {offer.titleAr}
      </AppText>
      <View style={styles.priceRow}>
        {offer.offerPrice != null ? (
          <AppText variant="label" color="primary">
            {offer.offerPrice.toLocaleString('en-US')} ر.س
          </AppText>
        ) : null}
        {hasCompare ? (
          <AppText variant="micro" color="textMuted" style={styles.compare}>
            {offer.originalPrice!.toLocaleString('en-US')}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      gap: 6,
    },
    imageWrap: {
      height: 118,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.bgSurface,
    },
    image: { width: '100%', height: '100%' },
    discount: {
      position: 'absolute',
      top: 8,
      start: 8,
      backgroundColor: colors.rose,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    discountText: {
      color: colors.bgDeep,
    },
    name: {
      ...butcherTypography.title,
      color: colors.textPrimary,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    compare: {
      textDecorationLine: 'line-through',
    },
  });
}

export default ButcherHomeOfferCard;
