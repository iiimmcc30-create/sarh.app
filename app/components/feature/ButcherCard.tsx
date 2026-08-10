// SAFAT — ButcherCard reusable component (Premium horizontal list card)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { ambientShadow } from '@/constants/designSystem';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow } from '@/lib/rtl';
import { useAuth } from '@/contexts/AuthContext';
import { resolveMediaUrl } from '@/services/media';
import { ButcherProfile } from '@/services/butcherData';
import {
  addFavoriteLocal,
  fetchButcherFavoriteStatus,
  toggleButcherFavorite,
} from '@/services/butcherFavorites';
import { countries } from '@/services/types';

const COVER_FALLBACK =
  'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80';

interface ButcherCardProps {
  butcher: ButcherProfile;
  variant?: 'full' | 'compact';
  onPress?: () => void;
  onOrder?: () => void;
}

export function ButcherCard({ butcher, variant = 'full', onPress, onOrder }: ButcherCardProps) {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const { colors, scheme } = useTheme();
  const { c, f } = useThemedStyles(({ colors }) => ({
    c: createCompactStyles(colors),
    f: createFullStyles(colors, scheme),
  }));
  const country = countries[butcher.country];
  const [favorited, setFavorited] = useState(false);
  const userId = user?.id ?? '';

  useEffect(() => {
    if (!accessToken || !userId) return;
    let cancelled = false;
    void fetchButcherFavoriteStatus(accessToken, butcher.id).then((isFav) => {
      if (!cancelled) {
        setFavorited(isFav);
        if (isFav) void addFavoriteLocal(userId, butcher.id);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, userId, butcher.id]);

  const handleFavoritePress = async () => {
    if (!accessToken || !userId) {
      router.push('/auth/phone');
      return;
    }
    const next = !favorited;
    setFavorited(next);
    try {
      const result = await toggleButcherFavorite(accessToken, userId, butcher.id, favorited);
      setFavorited(result);
    } catch {
      setFavorited(favorited);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push({ pathname: '/butchers/[id]', params: { id: butcher.id } });
  };

  const handleOrder = () => {
    if (onOrder) {
      onOrder();
      return;
    }
    router.push({ pathname: '/butchers/order', params: { butcherId: butcher.id } });
  };

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [c.card, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
      >
        <Image
          source={{ uri: resolveMediaUrl(butcher.logo) }}
          style={c.logo}
          contentFit="cover"
        />
        <View style={{ flex: 1 }}>
          <View style={c.nameRow}>
            <Text style={c.name} numberOfLines={1}>
              {butcher.nameAr}
            </Text>
            {butcher.type === 'verified' ? (
              <AppIcon name="shield-checkmark" size={12} color={colors.gold} />
            ) : null}
          </View>
          <View style={c.metaRow}>
            <Text style={c.flag}>{country.flag}</Text>
            <Text style={c.city}>{butcher.cityAr}</Text>
            <View style={c.dot} />
            <AppIcon name="star" size={10} color={colors.gold} />
            <Text style={c.rating}>{butcher.rating.toFixed(1)}</Text>
          </View>
        </View>
        <View
          style={[
            c.statusDot,
            { backgroundColor: butcher.workingHours.isOpen ? colors.success : colors.danger },
          ]}
        />
      </Pressable>
    );
  }

  const isOpen = butcher.workingHours.isOpen;
  const reviewLabel =
    butcher.reviewCount >= 1000
      ? `${(butcher.reviewCount / 1000).toFixed(1)}K`
      : String(butcher.reviewCount);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleOrder}
      style={({ pressed }) => [f.card, pressed && f.cardPressed]}
    >
      {/* Media */}
      <View style={f.mediaWrap}>
        <Image
          source={{ uri: resolveMediaUrl(butcher.cover) ?? resolveMediaUrl(butcher.logo) ?? COVER_FALLBACK }}
          style={f.mediaImg}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)']}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            f.statusBadge,
            { backgroundColor: isOpen ? colors.electric + 'E6' : colors.danger + 'E6' },
          ]}
        >
          <Text style={f.statusBadgeText}>{isOpen ? 'مفتوح الآن' : 'مغلق حالياً'}</Text>
        </View>
        <Pressable
          style={f.favBtn}
          hitSlop={8}
          onPress={(e) => {
            e.stopPropagation?.();
            void handleFavoritePress();
          }}
        >
          <AppIcon
            name={favorited ? 'heart' : 'heart-outline'}
            size={16}
            color={favorited ? colors.rose : '#fff'}
          />
        </Pressable>
        <View style={f.dotsRow}>
          <View style={[f.dot, f.dotActive]} />
          <View style={f.dot} />
          <View style={f.dot} />
        </View>
      </View>

      {/* Content */}
      <View style={f.body}>
        <View style={[f.titleRow, getRtlRow()]}>
          <View style={f.titleBlock}>
            <View style={[f.nameRow, getRtlRow()]}>
              <Text style={f.name} numberOfLines={1}>
                {butcher.nameAr}
              </Text>
              {butcher.subscriptionActive ? (
                <View style={f.verifiedPill}>
                  <AppIcon name="checkmark-circle" size={14} color={colors.gold} />
                </View>
              ) : null}
            </View>
            <View style={[f.locationRow, getRtlRow()]}>
              <AppIcon name="map-marker-outline" size={13} color={colors.textMuted} />
              <Text style={f.locationText} numberOfLines={1}>
                {butcher.cityAr} · {country.ar}
              </Text>
            </View>
          </View>
          <Pressable style={f.bookmarkBtn} hitSlop={8}>
            <AppIcon name="bookmark-outline" size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={[f.ratingRow, getRtlRow()]}>
          <AppIcon name="star" size={14} color={colors.gold} />
          <Text style={f.ratingValue}>{butcher.rating.toFixed(1)}</Text>
          <Text style={f.ratingCount}>({reviewLabel})</Text>
        </View>

        {butcher.specialties.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={f.chipsScroll}>
            <View style={[f.chipsRow, getRtlRow()]}>
              {butcher.specialties.slice(0, 4).map((spec, i) => (
                <View key={i} style={f.chip}>
                  <Text style={f.chipText}>{spec}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}

        <View style={[f.statsRow, getRtlRow()]}>
          <View style={f.statCell}>
            <Text style={f.statNum}>{butcher.totalOrders.toLocaleString('ar-SA')}</Text>
            <Text style={f.statLbl}>طلب مكتمل</Text>
          </View>
          <View style={f.statDivider} />
          <View style={f.statCell}>
            <Text style={f.statNum}>{butcher.orderCompletionRate}%</Text>
            <Text style={f.statLbl}>إتمام الطلبات</Text>
          </View>
          <View style={f.statDivider} />
          <View style={f.statCell}>
            <Text style={f.statNum}>{reviewLabel}</Text>
            <Text style={f.statLbl}>تقييم</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function createCompactStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      padding: spacing.md,
      backgroundColor: colors.bgSurface,
    },
    logo: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.bgElevated,
      borderWidth: 1.5,
      borderColor: colors.borderMid,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    name: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '700',
      flex: 1,
    },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    flag: { fontSize: 12 },
    city: { ...typography.micro, color: colors.textMuted },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.textSubtle,
    },
    rating: { ...typography.micro, color: colors.gold, fontWeight: '700' },
    statusDot: { width: 9, height: 9, borderRadius: 5 },
  });
}

function createFullStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const isDark = scheme === 'dark';
  return StyleSheet.create({
    card: {
      ...getRtlRow(),
      alignItems: 'stretch',
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderRadius: 22,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: isDark ? colors.borderSoft : colors.borderHairline,
      overflow: 'hidden',
      minHeight: 176,
      ...ambientShadow(scheme, 'card'),
    },
    cardPressed: {
      opacity: 0.94,
      transform: [{ scale: 0.985 }],
    },
    mediaWrap: {
      width: 148,
      flexShrink: 0,
      alignSelf: 'stretch',
      backgroundColor: colors.bgElevated,
      position: 'relative',
      overflow: 'hidden',
    },
    mediaImg: {
      ...StyleSheet.absoluteFillObject,
    },
    statusBadge: {
      position: 'absolute',
      top: 10,
      start: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    statusBadgeText: {
      ...typography.micro,
      color: '#fff',
      fontWeight: '800',
      fontSize: 10,
    },
    favBtn: {
      position: 'absolute',
      bottom: 28,
      start: 10,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    dotsRow: {
      position: 'absolute',
      bottom: 10,
      alignSelf: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.35)',
    },
    dotActive: {
      width: 14,
      backgroundColor: '#fff',
    },
    body: {
      flex: 1,
      minWidth: 0,
      padding: spacing.md,
      gap: 6,
      justifyContent: 'center',
    },
    titleRow: {
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    nameRow: {
      alignItems: 'center',
      gap: 6,
    },
    name: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      fontWeight: '800',
      fontSize: 16,
      flexShrink: 1,
      writingDirection: 'rtl',
    },
    verifiedPill: {
      flexShrink: 0,
    },
    bookmarkBtn: {
      padding: 4,
    },
    locationRow: {
      alignItems: 'center',
      gap: 4,
    },
    locationText: {
      ...typography.caption,
      color: colors.textMuted,
      flexShrink: 1,
      writingDirection: 'rtl',
    },
    ratingRow: {
      alignItems: 'center',
      gap: 4,
    },
    ratingValue: {
      ...typography.bodyStrong,
      color: colors.gold,
      fontWeight: '800',
    },
    ratingCount: {
      ...typography.caption,
      color: colors.textMuted,
    },
    chipsScroll: {
      marginTop: 2,
    },
    chipsRow: {
      gap: 6,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    chipText: {
      ...typography.micro,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    statsRow: {
      marginTop: 4,
      alignItems: 'stretch',
      justifyContent: 'space-between',
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderHairline,
    },
    statCell: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    statNum: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '800',
      fontSize: 13,
    },
    statLbl: {
      ...typography.micro,
      color: colors.textMuted,
      textAlign: 'center',
      fontSize: 10,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderHairline,
      marginVertical: 2,
    },
  });
}
