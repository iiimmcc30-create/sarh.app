// SAFAT — Butchers offers feed (العروض) — aggregates active offers across butchers
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
import { AppText } from '@/design-system/components';
import { Row, Screen, ScreenBody, Stack } from '@/design-system/layout';
import { useFocusEffect, useRouter } from 'expo-router';
import { safePush } from '@/lib/safeNavigate';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
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
            <AppText variant="caption" style={styles.discountText}>
              -{offer.discountPercent}%
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.productBody}>
        <AppText variant="cardTitle" numberOfLines={2}>
          {offer.titleAr}
        </AppText>
        <Row align="baseline" gap="xs">
          {offer.offerPrice != null ? (
            <AppText variant="price" style={styles.offerPrice}>
              {offer.offerPrice.toLocaleString('en-US')} ر.س
            </AppText>
          ) : null}
          {offer.originalPrice != null && offer.originalPrice !== offer.offerPrice ? (
            <AppText variant="caption" style={styles.originalPrice}>
              {offer.originalPrice.toLocaleString('en-US')}
            </AppText>
          ) : null}
        </Row>
        {validity ? (
          <Row align="center" gap="xs">
            <AppIcon name="clock-outline" size={11} color={colors.textMuted} />
            <AppText variant="caption" color="textMuted">
              {validity}
            </AppText>
          </Row>
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
        style={styles.cardHeader}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={item.nameAr}
      >
        <Row justify="between" align="center">
          <Row align="center" gap="sm" fill>
            <View style={styles.logoWrap}>
              <Image source={uriSource(item.logo || item.cover)} style={styles.logo} contentFit="cover" />
            </View>
            <Stack gap="xs" fill>
              <Row align="center" gap="xs">
                <AppText variant="body" numberOfLines={1} style={styles.butcherName}>
                  {item.nameAr}
                </AppText>
                {item.subscriptionActive ? (
                  <AppIcon name="shield-checkmark" size={14} color={colors.gold} />
                ) : null}
              </Row>
              <Row align="center" gap="xs">
                <AppIcon name="star" size={12} color={colors.gold} />
                <AppText variant="bodyMedium" style={styles.rating}>
                  {item.rating.toFixed(1)}
                </AppText>
                {item.cityAr ? (
                  <AppText variant="caption" color="textMuted">
                    · {item.cityAr}
                  </AppText>
                ) : null}
              </Row>
            </Stack>
          </Row>
          <Row align="center" gap="xs" style={styles.visitChip}>
            <AppText variant="bodyMedium" style={styles.visitText}>
              زيارة
            </AppText>
            <AppIcon name="chevron-back" size={14} color={colors.electricBright} />
          </Row>
        </Row>
      </Pressable>

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
    safePush({ pathname: '/butchers/[id]', params: { id } }, undefined, router);

  return (
    <Screen edges={['top']}>
      <ScreenHeader variant="screen" title="العروض" />

      {loading ? (
        <ScreenBody scroll={false} gutter={false}>
          <Stack fill align="center" style={styles.center}>
            <ActivityIndicator size="large" color={colors.electricBright} />
            <AppText variant="bodySmall" color="textMuted">
              جاري تحميل العروض...
            </AppText>
          </Stack>
        </ScreenBody>
      ) : (
        <ScreenBody
          gap="lg"
          padTop="lg"
          padBottom="lg"
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
            <Stack align="center" gap="sm" style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <AppIcon name="pricetag-outline" size={34} color={colors.electricBright} />
              </View>
              <AppText variant="sectionTitle" align="center">
                لا توجد عروض حالياً
              </AppText>
              <AppText variant="bodySmall" color="textMuted" align="center">
                تابعنا لاحقاً لأحدث عروض الملاحم
              </AppText>
            </Stack>
          ) : (
            <>
              <Stack gap="none">
                <AppText variant="body">عروض بالقرب منك</AppText>
                <AppText variant="bodySmall" color="textMuted">
                  أفضل عروض الملاحم على منتجاتها المختارة
                </AppText>
              </Stack>
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
        </ScreenBody>
      )}

      <ButchersTabBar active="offers" />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    center: { justifyContent: 'center' },
    card: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.xl,
      padding: spacing.md,
      gap: spacing.md,
    },
    cardHeader: { width: '100%' },
    logoWrap: {
      width: 46,
      height: 46,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: colors.bgSurface,
    },
    logo: { width: '100%', height: '100%' },
    butcherName: { flexShrink: 1 },
    rating: { color: colors.gold },
    visitChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.electric + '16',
    },
    visitText: { color: colors.electricBright },
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
      end: 8,
      backgroundColor: colors.rose,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    discountText: { color: '#fff' },
    productBody: { padding: spacing.sm, gap: 5 },
    offerPrice: { color: colors.electricBright },
    originalPrice: {
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    empty: { paddingVertical: 90 },
    emptyIconWrap: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.electric + '14',
      marginBottom: spacing.xs,
    },
  });
}
