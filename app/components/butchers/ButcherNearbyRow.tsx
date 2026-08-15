// Vertical nearby butcher row — logo on physical right, RTL cover trail
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { butcherSoftCardStyle } from '@/components/butchers/butcherSoftCard';
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
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

type Props = {
  butcher: ButcherProfile;
  onPress: () => void;
  showDivider?: boolean;
};

export function ButcherNearbyRow({ butcher, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, scheme }) => createStyles(colors, scheme));
  const name = butcher.nameAr || butcher.name;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
    >
      <CoverTrailRow justify="flex-end" gap={12}>
        <RtlTextShell flex style={{ gap: 4 }}>
          <RtlText style={styles.name} numberOfLines={1}>
            {name}
          </RtlText>
          <View style={styles.ratingRow}>
            <AppIcon name="star" size={12} color={colors.gold} />
            <RtlText style={styles.rating}>
              {butcher.rating.toFixed(1)} ({butcherReviewCountLabel(butcher.reviewCount || butcher.totalOrders)})
            </RtlText>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <AppIcon name="map-marker-outline" size={12} color={colors.textMuted} />
              <RtlText style={styles.metaText}>{butcher.cityAr || '—'}</RtlText>
            </View>
            <View style={styles.metaItem}>
              <AppIcon name="bicycle-outline" size={12} color={colors.textMuted} />
              <RtlText style={styles.metaText}>{butcherFeeLabel(butcher)}</RtlText>
            </View>
            <View style={styles.metaItem}>
              <AppIcon name="clock-outline" size={12} color={colors.textMuted} />
              <RtlText style={styles.metaText}>{butcherEtaLabel(butcher)}</RtlText>
            </View>
            <View style={styles.metaItem}>
              <AppIcon name="receipt-outline" size={12} color={colors.textMuted} />
              <RtlText style={styles.metaText} numberOfLines={1}>
                {butcherMinOrderLabel(butcher)}
              </RtlText>
            </View>
          </View>
        </RtlTextShell>
        <View style={styles.logoWrap}>
          <Image
            source={uriSource(butcher.logo || butcher.cover)}
            style={styles.logo}
            contentFit="cover"
          />
        </View>
      </CoverTrailRow>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  return StyleSheet.create({
    row: {
      ...butcherSoftCardStyle(colors, scheme),
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
    },
    name: {
      ...typography.bodyStrong,
      fontSize: 15,
      color: colors.textPrimary,
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
      backgroundColor: colors.bgDeep,
      flexShrink: 0,
    },
    logo: { width: '100%', height: '100%' },
  });
}
