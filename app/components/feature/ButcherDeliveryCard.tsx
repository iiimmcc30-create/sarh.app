import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { sarh } from '@/constants/sarhTokens';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { gccCurrencies, type ButcherProfile } from '@/services/butcherData';

type ButcherDeliveryCardProps = {
  butcher: ButcherProfile;
  width: number;
  onPress?: () => void;
};

function reviewLabel(count: number): string {
  if (count > 999) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

function promoLabel(butcher: ButcherProfile): string | null {
  if ((butcher.totalOrders ?? 0) < 20) return 'جديد';
  if (butcher.rating >= 4.5) return 'الأعلى تقييماً';
  if (butcher.type === 'verified' || butcher.subscriptionActive) return 'مميز';
  return null;
}

function descriptionLine(butcher: ButcherProfile): string {
  if (butcher.bioAr?.trim()) return butcher.bioAr.trim();
  if (butcher.specialties?.length) return butcher.specialties.slice(0, 3).join('، ');
  return butcher.cityAr || 'لحوم طازجة';
}

/** Hungerstation-style butcher card for home dual horizontal rows. */
export function ButcherDeliveryCard({ butcher, width, onPress }: ButcherDeliveryCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors: c }) => createStyles(c));
  const name = butcher.nameAr || butcher.name;
  const promo = promoLabel(butcher);
  const currency = gccCurrencies[butcher.country];
  const desc = descriptionLine(butcher);
  const timeLabel = butcher.workingHours.isOpen ? '25 - 40 د' : 'مغلق';
  const feeLabel = butcher.workingHours.isOpen
    ? butcher.subscriptionActive
      ? 'مجاني'
      : `15 ${currency?.symbol ?? 'ر.س'}`
    : '—';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={styles.coverWrap}>
        <Image
          source={uriSource(butcher.cover || butcher.logo)}
          style={styles.cover}
          contentFit="cover"
        />

        {/* Physical LTR overlays — heart left · rating · logo right */}
        <View style={styles.coverTopRow}>
          <View style={styles.heartBtn}>
            <AppIcon name="heart-outline" size={15} color="#fff" />
          </View>
          <View style={styles.topEndCluster}>
            <View style={styles.ratingChip}>
              <Text style={styles.ratingCount}>({reviewLabel(butcher.reviewCount || butcher.totalOrders)})</Text>
              <Text style={styles.ratingText}>{butcher.rating.toFixed(1)}</Text>
              <AppIcon name="star" size={11} color={colors.gold} />
            </View>
            <View style={styles.logoWrap}>
              <Image
                source={uriSource(butcher.logo || butcher.cover || butcher.user?.avatar)}
                style={styles.logo}
                contentFit="cover"
              />
            </View>
          </View>
        </View>

        {promo ? (
          <View style={styles.promoPill}>
            <AppIcon name="heart" size={10} color="#fff" />
            <Text style={styles.promoText}>{promo}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        {/* Physical LTR: name → badge, pinned visual right */}
        <View style={styles.nameRow}>
          <View style={styles.nameShell}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
          </View>
          {butcher.subscriptionActive || butcher.type === 'verified' ? (
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>H+</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.descShell}>
          <Text style={styles.desc} numberOfLines={1}>
            {desc}
          </Text>
        </View>

        <View style={styles.pillsRow}>
          <View style={styles.metaPill}>
            <AppIcon name="clock-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaPillText}>{timeLabel}</Text>
          </View>
          <View style={styles.metaPill}>
            <AppIcon name="people-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaPillText}>{feeLabel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bgSurface,
      borderRadius: sarh.radius.card,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    pressed: {
      opacity: 0.92,
    },
    coverWrap: {
      // Reference card image proportion (~square-ish top on half-width card).
      height: 132,
      backgroundColor: colors.bgElevated,
      position: 'relative',
    },
    cover: {
      ...StyleSheet.absoluteFillObject,
    },
    coverTopRow: {
      position: 'absolute',
      top: 8,
      left: 8,
      right: 8,
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      zIndex: 2,
    },
    heartBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(0,0,0,0.28)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    topEndCluster: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: 6,
    },
    ratingChip: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.92)',
    },
    ratingText: {
      ...typography.micro,
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: 11,
    },
    ratingCount: {
      ...typography.micro,
      color: colors.textMuted,
      fontSize: 10,
    },
    logoWrap: {
      width: 34,
      height: 34,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: colors.bgSurface,
      borderWidth: 1.5,
      borderColor: '#fff',
    },
    logo: {
      width: '100%',
      height: '100%',
    },
    promoPill: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.rose,
      zIndex: 2,
    },
    promoText: {
      ...typography.micro,
      color: '#fff',
      fontWeight: '700',
      fontSize: 10,
    },
    info: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      gap: 6,
    },
    nameRow: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      width: '100%',
    },
    nameShell: {
      direction: 'ltr',
      flexShrink: 1,
      minWidth: 0,
    },
    name: {
      ...typography.bodyStrong,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    brandBadge: {
      width: 20,
      height: 20,
      borderRadius: 5,
      backgroundColor: '#5B4BDB',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    brandBadgeText: {
      color: colors.gold,
      fontSize: 8,
      fontWeight: '800',
      lineHeight: 10,
    },
    descShell: {
      direction: 'ltr',
      width: '100%',
    },
    desc: {
      ...typography.caption,
      fontSize: 11,
      lineHeight: 16,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
      width: '100%',
    },
    pillsRow: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 2,
    },
    metaPill: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
    },
    metaPillText: {
      ...typography.micro,
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '600',
    },
  });
}
