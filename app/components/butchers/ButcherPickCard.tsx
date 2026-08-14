// Horizontal butcher pick card — cover image + RTL meta (Sarh identity)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { MENU_CARD } from '@/components/feature/SidebarMenu';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  butcherEtaLabel,
  butcherFeeLabel,
  butcherPickupLabel,
  butcherReviewCountLabel,
} from '@/lib/butcherStoreMeta';
import type { ButcherProfile } from '@/services/butcherData';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && { opacity: 0.94 }]}
    >
      <View style={styles.cover}>
        <Image
          source={uriSource(butcher.cover || butcher.logo)}
          style={styles.coverImg}
          contentFit="cover"
        />
        {promoted || butcher.subscriptionActive ? (
          <View style={styles.promo}>
            <Text style={styles.promoText}>مروج</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.rtlShell}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={styles.ratingRow}>
        <AppIcon name="star" size={12} color={colors.gold} />
        <Text style={styles.rating}>
          {butcher.rating.toFixed(1)} ({butcherReviewCountLabel(butcher.reviewCount || butcher.totalOrders)})
        </Text>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <AppIcon name="bicycle-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{butcherFeeLabel(butcher)}</Text>
        </View>
        <View style={styles.metaItem}>
          <AppIcon name="clock-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{butcherEtaLabel(butcher)}</Text>
        </View>
        <View style={styles.metaItem}>
          <AppIcon name="storefront-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {butcherPickupLabel(butcher)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: 6,
      backgroundColor: colors.bgElevated,
      borderRadius: MENU_CARD.radius,
      overflow: 'hidden',
      paddingBottom: spacing.sm,
    },
    cover: {
      height: 118,
      borderRadius: 0,
      overflow: 'hidden',
      backgroundColor: colors.bgElevated,
    },
    coverImg: { width: '100%', height: '100%' },
    promo: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.electric,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    promoText: { ...typography.micro, color: '#fff', fontWeight: '700', fontSize: 10 },
    rtlShell: { width: '100%', direction: 'ltr', paddingHorizontal: spacing.sm, paddingTop: 8 },
    name: {
      ...typography.bodyStrong,
      fontSize: 14,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    ratingRow: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
    },
    rating: {
      ...typography.caption,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
    metaRow: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: spacing.sm,
    },
    metaItem: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: 3,
    },
    metaText: {
      ...typography.micro,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
  });
}
