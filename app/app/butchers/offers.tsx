// SAFAT — Butchers offers feed (العروض) — aggregates active offers across butchers
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
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
import { getRtlRow, getRtlText } from '@/lib/rtl';
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
        <Text style={styles.productName} numberOfLines={2}>
          {offer.titleAr}
        </Text>
        <View style={[styles.priceRow, getRtlRow()]}>
          {offer.offerPrice != null ? (
            <Text style={styles.offerPrice}>{offer.offerPrice.toLocaleString('en-US')} ر.س</Text>
          ) : null}
          {offer.originalPrice != null && offer.originalPrice !== offer.offerPrice ? (
            <Text style={styles.originalPrice}>{offer.originalPrice.toLocaleString('en-US')}</Text>
          ) : null}
        </View>
        {validity ? (
          <View style={[styles.validityRow, getRtlRow()]}>
            <AppIcon name="clock-outline" size={11} color={colors.textMuted} />
            <Text style={styles.validityText}>{validity}</Text>
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
  return (
    <View style={styles.card}>
      <Pressable
        style={[styles.cardHeader, getRtlRow()]}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={item.nameAr}
      >
        <View style={[styles.headerMain, getRtlRow()]}>
          <View style={styles.logoWrap}>
            <Image source={uriSource(item.logo || item.cover)} style={styles.logo} contentFit="cover" />
          </View>
          <View style={styles.headerText}>
            <View style={[styles.nameRow, getRtlRow()]}>
              <Text style={styles.butcherName} numberOfLines={1}>
                {item.nameAr}
              </Text>
              {item.subscriptionActive ? (
                <AppIcon name="shield-checkmark" size={14} color={colors.gold} />
              ) : null}
            </View>
            <View style={[styles.metaRow, getRtlRow()]}>
              <AppIcon name="star" size={12} color={colors.gold} />
              <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
              {item.cityAr ? <Text style={styles.city}>· {item.cityAr}</Text> : null}
            </View>
          </View>
        </View>
        <View style={[styles.visitChip, getRtlRow()]}>
          <Text style={styles.visitText}>زيارة</Text>
          <AppIcon name="chevron-back" size={14} color={colors.electricBright} />
        </View>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.productsRow, getRtlRow()]}
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
      <ScreenHeader title="العروض" />

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
                <AppIcon name="pricetag-outline" size={34} color={colors.electricBright} />
              </View>
              <Text style={styles.emptyTitle}>لا توجد عروض حالياً</Text>
              <Text style={styles.emptySub}>تابعنا لاحقاً لأحدث عروض الملاحم</Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionLabelWrap}>
                <View style={styles.rtlTextShell}>
                  <Text style={styles.heroTitle}>عروض بالقرب منك</Text>
                  <Text style={styles.heroSub}>أفضل عروض الملاحم على منتجاتها المختارة</Text>
                </View>
              </View>
              {data.map((item) => (
                <ButcherOffersCard
                  key={item.butcherId}
                  item={item}
                  onOpen={() => openButcher(item.butcherId)}
                  colors={colors}
                  styles={styles}
                />
              ))}
            </>
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
    scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.lg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    loadingText: { ...typography.caption, color: colors.textMuted },
    sectionLabelWrap: {
      paddingHorizontal: 0,
    },
    rtlTextShell: {
      width: '100%',
      direction: 'ltr',
    },
    heroTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    heroSub: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
      marginTop: 2,
    },
    card: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.xl,
      padding: spacing.md,
      gap: spacing.md,
    },
    cardHeader: { alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    headerMain: { alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 },
    logoWrap: {
      width: 46,
      height: 46,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: colors.bgSurface,
    },
    logo: { width: '100%', height: '100%' },
    headerText: { flex: 1, minWidth: 0, gap: 3 },
    nameRow: { alignItems: 'center', gap: 5 },
    butcherName: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      flexShrink: 1,
      ...getRtlText(),
    },
    metaRow: { alignItems: 'center', gap: 4 },
    rating: { ...typography.micro, color: colors.gold, fontWeight: '700' },
    city: { ...typography.micro, color: colors.textMuted },
    visitChip: {
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.electric + '16',
    },
    visitText: { ...typography.micro, color: colors.electricBright, fontWeight: '700' },
    productsRow: { gap: spacing.sm, paddingVertical: 2 },
    product: {
      width: 150,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    productImageWrap: { width: '100%', height: 100, position: 'relative', backgroundColor: colors.bgElevated },
    productImage: { width: '100%', height: '100%' },
    discountBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.rose,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    discountText: { ...typography.micro, color: '#fff', fontWeight: '800', fontSize: 10 },
    productBody: { padding: spacing.sm, gap: 5 },
    productName: {
      ...typography.caption,
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      lineHeight: 17,
      ...getRtlText(),
    },
    priceRow: { alignItems: 'baseline', gap: 6 },
    offerPrice: { ...typography.bodyStrong, fontSize: 14, color: colors.electricBright, fontWeight: '800' },
    originalPrice: {
      ...typography.micro,
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    validityRow: { alignItems: 'center', gap: 4 },
    validityText: { ...typography.micro, color: colors.textMuted, fontSize: 10, ...getRtlText() },
    empty: { alignItems: 'center', paddingVertical: 90, gap: spacing.sm },
    emptyIconWrap: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.electric + '14',
      marginBottom: spacing.xs,
    },
    emptyTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    emptySub: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
  });
}
