// Vertical nearby butcher row — logo on physical right, RTL cover trail
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { MENU_CARD } from '@/components/feature/SidebarMenu';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  butcherEtaLabel,
  butcherFeeLabel,
  butcherMinOrderLabel,
  butcherReviewCountLabel,
} from '@/lib/butcherStoreMeta';
import type { ButcherProfile } from '@/services/butcherData';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  butcher: ButcherProfile;
  onPress: () => void;
};

export function ButcherNearbyRow({ butcher, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const name = butcher.nameAr || butcher.name;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.coverTrail}>
        <View style={styles.textShell}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.ratingRow}>
            <AppIcon name="star" size={12} color={colors.gold} />
            <Text style={styles.rating}>
              {butcher.rating.toFixed(1)} ({butcherReviewCountLabel(butcher.reviewCount || butcher.totalOrders)})
            </Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <AppIcon name="map-marker-outline" size={12} color={colors.textMuted} />
              <Text style={styles.metaText}>{butcher.cityAr || '—'}</Text>
            </View>
            <View style={styles.metaItem}>
              <AppIcon name="bicycle-outline" size={12} color={colors.textMuted} />
              <Text style={styles.metaText}>{butcherFeeLabel(butcher)}</Text>
            </View>
            <View style={styles.metaItem}>
              <AppIcon name="clock-outline" size={12} color={colors.textMuted} />
              <Text style={styles.metaText}>{butcherEtaLabel(butcher)}</Text>
            </View>
            <View style={styles.metaItem}>
              <AppIcon name="receipt-outline" size={12} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {butcherMinOrderLabel(butcher)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.logoWrap}>
          <Image
            source={uriSource(butcher.logo || butcher.cover)}
            style={styles.logo}
            contentFit="cover"
          />
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      backgroundColor: colors.bgElevated,
      borderRadius: MENU_CARD.radius,
      overflow: 'hidden',
    },
    coverTrail: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 12,
    },
    textShell: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
      gap: 4,
    },
    name: {
      ...typography.bodyStrong,
      fontSize: 15,
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
    },
    rating: { ...typography.caption, color: colors.textMuted },
    metaRow: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 8,
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
    logoWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: colors.bgSurface,
      flexShrink: 0,
    },
    logo: { width: '100%', height: '100%' },
  });
}
