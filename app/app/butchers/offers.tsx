// SAFAT — Butchers offers feed — cover-style cards (هوية سرح)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
import { menuCardStyle } from '@/components/feature/SidebarMenu';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import { resolveMediaUrl } from '@/services/media';

const MAX_BUTCHERS = 24;

type OfferView = {
  id: string;
  titleAr: string;
  image?: string;
  originalPrice?: number;
  offerPrice?: number;
  discountPercent?: number;
  validUntil?: string;
};

type ButcherOffers = {
  butcherId: string;
  nameAr: string;
  logo?: string;
  cover?: string;
  cityAr?: string;
  rating: number;
  reviewCount: number;
  subscriptionActive: boolean;
  offers: OfferView[];
};

function formatValidity(iso?: string): string | null {
  if (!iso) return null;
  try {
    return `حتى ${new Date(iso).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}`;
  } catch {
    return null;
  }
}

function mapOffers(raw: unknown): OfferView[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((o: any) => ({
    id: String(o.id),
    titleAr: o.titleAr || o.titleEn || 'عرض',
    image: resolveMediaUrl(o.image) ?? undefined,
    originalPrice: o.originalPrice ?? undefined,
    offerPrice: o.offerPrice ?? undefined,
    discountPercent: o.discountPercent ?? undefined,
    validUntil: o.validUntil ?? undefined,
  }));
}

function OfferProductCard({
  offer,
  onPress,
  colors,
  styles,
}: {
  offer: OfferView;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const validity = formatValidity(offer.validUntil);
  return (
    <Pressable
      style={({ pressed }) => [styles.product, pressed && { opacity: 0.92 }]}
      onPress={onPress}
    >
      <View style={styles.productImageWrap}>
        <Image source={uriSource(offer.image)} style={styles.productImage} contentFit="cover" />
        {offer.discountPercent ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{offer.discountPercent}%</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.productBody}>
        <View style={styles.rtlTextShell}>
          <Text style={styles.productName} numberOfLines={2}>
            {offer.titleAr}
          </Text>
        </View>
        <View style={styles.priceRow}>
          {offer.offerPrice != null ? (
            <Text style={styles.offerPrice}>{offer.offerPrice.toLocaleString('en-US')} ر.س</Text>
          ) : null}
          {offer.originalPrice != null && offer.originalPrice !== offer.offerPrice ? (
            <Text style={styles.originalPrice}>{offer.originalPrice.toLocaleString('en-US')}</Text>
          ) : null}
        </View>
        {validity ? (
          <View style={styles.validityRow}>
            <View style={styles.rtlTextShellFlex}>
              <Text style={styles.validityText}>{validity}</Text>
            </View>
            <AppIcon name="clock-outline" size={11} color={colors.textMuted} />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function ButcherOffersCard({
  item,
  onOpen,
  colors,
  styles,
}: {
  item: ButcherOffers;
  onOpen: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const meta = [item.rating.toFixed(1), item.cityAr].filter(Boolean).join(' · ');

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [styles.headerRow, pressed && { opacity: 0.92 }]}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={item.nameAr}
      >
        <View style={styles.chevronSlot}>
          <AppIcon name="angle-left" size={14} color={colors.textMuted} />
        </View>
        <View style={styles.coverTrail}>
          <View style={styles.rtlTextShellFlex}>
            <Text style={styles.butcherName} numberOfLines={1}>
              {item.nameAr}
            </Text>
            <Text style={styles.butcherMeta} numberOfLines={1}>
              {item.subscriptionActive ? `موثّق · ${meta}` : meta}
            </Text>
          </View>
          <View style={styles.logoWrap}>
            <Image
              source={uriSource(item.logo || item.cover)}
              style={styles.logo}
              contentFit="cover"
            />
          </View>
        </View>
      </Pressable>

      <View style={[styles.insetDivider, { backgroundColor: colors.borderSoft }]} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsRow}
      >
        {item.offers.map((offer) => (
          <OfferProductCard
            key={offer.id}
            offer={offer}
            onPress={onOpen}
            colors={colors}
            styles={styles}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function ButcherOffersScreen() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [data, setData] = useState<ButcherOffers[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    try {
      const listRes = await fetch(`${API_BASE}/api/butchers?sort=rating`, { headers });
      const listJson = await listRes.json();
      const list: any[] = Array.isArray(listJson?.data?.butchers) ? listJson.data.butchers : [];
      const candidates = list
        .filter((b) => (b.country || 'SA') !== 'EG')
        .slice(0, MAX_BUTCHERS);

      const details = await Promise.all(
        candidates.map(async (b) => {
          try {
            const res = await fetch(`${API_BASE}/api/butchers/${b.id}`, { headers });
            if (!res.ok) return null;
            const json = await res.json();
            const d = json?.data;
            if (!d) return null;
            const offers = mapOffers(d.offers);
            if (offers.length === 0) return null;
            const entry: ButcherOffers = {
              butcherId: d.id,
              nameAr: d.nameAr || d.nameEn || 'ملحمة',
              logo: resolveMediaUrl(d.logo) ?? undefined,
              cover: resolveMediaUrl(d.cover) ?? undefined,
              cityAr: d.cityAr || '',
              rating: d.rating ?? 5,
              reviewCount: d.reviewCount ?? 0,
              subscriptionActive: Boolean(d.subscriptionActive),
              offers,
            };
            return entry;
          } catch {
            return null;
          }
        }),
      );

      setData(details.filter((d): d is ButcherOffers => d != null));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const openButcher = (id: string) =>
    router.push({ pathname: '/butchers/[id]', params: { id } });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.electricBright} />
          <Text style={styles.loadingText}>جاري تحميل العروض...</Text>
        </View>
      ) : (
        <AppScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.electricBright}
            />
          }
        >
          {data.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <AppIcon name="pricetag-outline" size={22} color={colors.textPrimary} />
              </View>
              <View style={styles.rtlTextShell}>
                <Text style={styles.emptyTitle}>لا توجد عروض حالياً</Text>
              </View>
              <View style={styles.rtlTextShell}>
                <Text style={styles.emptySub}>تابعنا لاحقاً لأحدث عروض الملاحم</Text>
              </View>
            </View>
          ) : (
            data.map((item) => (
              <ButcherOffersCard
                key={item.butcherId}
                item={item}
                onOpen={() => openButcher(item.butcherId)}
                colors={colors}
                styles={styles}
              />
            ))
          )}
        </AppScrollView>
      )}

      <ButchersTabBar active="offers" />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    flex: { flex: 1 },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    loadingText: { ...typography.caption, color: colors.textMuted },
    card: menuCardStyle(colors),
    headerRow: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      minHeight: 52,
    },
    chevronSlot: {
      width: 18,
      flexShrink: 0,
    },
    coverTrail: {
      flex: 1,
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
      minWidth: 0,
    },
    rtlTextShell: {
      width: '100%',
      direction: 'ltr',
    },
    rtlTextShellFlex: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
    },
    butcherName: {
      ...typography.bodyStrong,
      fontSize: 15,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    butcherMeta: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
      marginTop: 2,
    },
    logoWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.bgDeep,
      flexShrink: 0,
    },
    logo: { width: '100%', height: '100%' },
    insetDivider: {
      height: StyleSheet.hairlineWidth,
      marginHorizontal: spacing.lg,
    },
    productsRow: {
      flexDirection: 'row',
      direction: 'ltr',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    product: {
      width: 148,
      backgroundColor: colors.bgDeep,
      borderRadius: 12,
      overflow: 'hidden',
    },
    productImageWrap: {
      width: '100%',
      height: 96,
      position: 'relative',
      backgroundColor: colors.bgSurface,
    },
    productImage: { width: '100%', height: '100%' },
    discountBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.electric,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    discountText: { ...typography.micro, color: '#fff', fontWeight: '700', fontSize: 10 },
    productBody: { padding: spacing.sm, gap: 4 },
    productName: {
      ...typography.caption,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 18,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    priceRow: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'baseline',
      gap: 6,
    },
    offerPrice: {
      ...typography.bodyStrong,
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    originalPrice: {
      ...typography.micro,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    validityRow: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
    },
    validityText: {
      ...typography.micro,
      color: colors.textMuted,
      fontSize: 10,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    empty: { alignItems: 'center', paddingVertical: 80, gap: spacing.sm },
    emptyIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgElevated,
      marginBottom: spacing.xs,
    },
    emptyTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    emptySub: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
  });
}
