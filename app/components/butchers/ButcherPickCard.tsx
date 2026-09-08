import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { AppText, SarhAvatar } from '@/design-system/components';
import { butcherTypography } from '@/constants/butcherTypography';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  butcherEtaLabel,
  butcherFeeLabel,
  butcherReviewCountLabel,
  hasButcherRating,
} from '@/lib/butcherStoreMeta';
import { getRtlRow } from '@/lib/rtl';
import type { ButcherProfile } from '@/services/butcherData';
import { Pressable, StyleSheet, View } from 'react-native';

type Props = {
  butcher: ButcherProfile;
  width: number;
  promoted?: boolean;
  onPress: () => void;
};

export function ButcherPickCard({ butcher, width, promoted, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const name = butcher.nameAr || butcher.name;
  const cover = butcher.cover || butcher.logo;
  const logo = butcher.logo || butcher.cover;
  const showRating = hasButcherRating(butcher);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && { opacity: 0.94 }]}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <View style={styles.cover}>
        {cover ? (
          <Image source={uriSource(cover)} style={styles.coverImg} contentFit="cover" />
        ) : (
          <View style={styles.coverFallback} />
        )}
        {showRating ? (
          <View style={[styles.ratingBadge, getRtlRow()]}>
            <AppIcon name="star" size={11} color={colors.gold} />
            <AppText variant="micro">{butcher.rating.toFixed(1)}</AppText>
          </View>
        ) : null}
        {logo ? (
          <View style={styles.avatarWrap}>
            <SarhAvatar uri={logo} name={name} size="sm" />
          </View>
        ) : null}
        {promoted || butcher.subscriptionActive ? (
          <View style={styles.promo}>
            <AppText variant="micro" style={styles.promoText}>
              مروج
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="label" numberOfLines={1} style={styles.name}>
        {name}
      </AppText>
      {showRating ? (
        <AppText variant="caption" color="textMuted">
          ({butcherReviewCountLabel(butcher.reviewCount || butcher.totalOrders)})
        </AppText>
      ) : null}
      <View style={[styles.metaRow, getRtlRow()]}>
        <AppIcon name="clock-outline" size={12} color={colors.textMuted} />
        <AppText variant="caption" color="textMuted">
          {butcherEtaLabel(butcher)}
        </AppText>
      </View>
      <View style={[styles.metaRow, getRtlRow()]}>
        <AppIcon name="bicycle-outline" size={12} color={colors.electricBright} />
        <AppText variant="caption" color="primary">
          {butcherFeeLabel(butcher)}
        </AppText>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: 6,
      backgroundColor: 'transparent',
    },
    cover: {
      height: 148,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.bgSurface,
    },
    coverImg: { width: '100%', height: '100%' },
    coverFallback: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.bgSurface,
    },
    ratingBadge: {
      position: 'absolute',
      top: 8,
      end: 8,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
    },
    avatarWrap: {
      position: 'absolute',
      start: 8,
      bottom: 8,
      padding: 3,
      borderRadius: 12,
      backgroundColor: colors.bgElevated,
    },
    promo: {
      position: 'absolute',
      top: 8,
      start: 8,
      backgroundColor: colors.electric,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    promoText: {
      color: colors.bgDeep,
    },
    name: {
      ...butcherTypography.title,
      color: colors.textPrimary,
      marginTop: 2,
    },
    metaRow: {
      alignItems: 'center',
      gap: 4,
    },
  });
}

export default ButcherPickCard;
