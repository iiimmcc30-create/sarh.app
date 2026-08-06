// Promotion hub — paid à-la-carte services (pin, feature, boost)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ListingBoostSheet } from '@/components/listing/ListingBoostSheet';
import { PromotionStatsSheet } from '@/components/listing/PromotionStatsSheet';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { searchListings } from '@/services/listings';
import type { Listing } from '@/services/types';
import {
  BOOST_TYPE_META,
  SERVICE_TYPE_ORDER,
  FALLBACK_BOOST_PLANS,
  fetchBoostPlans,
  type BoostPlansMap,
  type BoostTypeKey,
} from '@/services/listingBoost';
import {
  FALLBACK_PROMOTION_PLANS,
  fetchPromotionPlans,
  type PromotionPlanOption,
} from '@/services/listingPromotion';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { navigateToCreateListing } from '@/lib/navigateToCreateListing';
import { rtlBackIcon, rtlDirection, rtlRow, rtlText } from '@/lib/rtl';
import { resolveCurrentUserId } from '@/lib/currentUser';

export default function PromotionScreen() {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));
  const router = useRouter();
  const { me } = useApp();
  const { user, accessToken } = useAuth();
  const { subscription } = useSubscription();

  const [plans, setPlans] = useState<BoostPlansMap>(FALLBACK_BOOST_PLANS);
  const [promotionPlans, setPromotionPlans] = useState<PromotionPlanOption[]>(
    FALLBACK_PROMOTION_PLANS,
  );
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [boostListingId, setBoostListingId] = useState<string | null>(null);
  const [initialBoostType, setInitialBoostType] = useState<BoostTypeKey>('promotion');
  const [statsListingId, setStatsListingId] = useState<string | null>(null);

  const userId = resolveCurrentUserId(user, me);
  const dailyLimit = Number(subscription?.permissions?.maxAdsPer24Hours ?? 1);
  const dailyUsed = subscription?.usageCounters?.dailyAdsUsed ?? 0;

  const loadListings = useCallback(async () => {
    if (!userId) {
      setMyListings([]);
      setLoadingListings(false);
      return;
    }
    setLoadingListings(true);
    try {
      const rows = await searchListings({ sellerId: userId }, accessToken);
      setMyListings(rows.slice(0, 20));
    } catch {
      setMyListings([]);
    } finally {
      setLoadingListings(false);
    }
  }, [accessToken, userId]);

  useFocusEffect(
    useCallback(() => {
      void loadListings();
      setLoadingPlans(true);
      void fetchBoostPlans()
        .then(setPlans)
        .finally(() => setLoadingPlans(false));
      void fetchPromotionPlans().then(setPromotionPlans);
    }, [loadListings]),
  );

  const pricingMatrix = useMemo(() => {
    const durations = [1, 3, 7];
    return SERVICE_TYPE_ORDER.map((key) => {
      const meta = BOOST_TYPE_META[key];
      const options =
        key === 'promotion'
          ? promotionPlans
          : plans[key] ?? FALLBACK_BOOST_PLANS[key];
      return {
        key,
        meta,
        prices: durations.map((days) => {
          const plan = options.find((p) => p.durationDays === days);
          return plan?.amount ?? '—';
        }),
      };
    });
  }, [plans, promotionPlans]);

  const openBoost = (listingId: string, type: BoostTypeKey = 'pinned') => {
    setInitialBoostType(type);
    setBoostListingId(listingId);
  };

  const selectedListing = useMemo(
    () => myListings.find((l) => l.id === boostListingId) ?? null,
    [boostListingId, myListings],
  );

  return (
    <ScreenScaffold edges={['top']}>
      <View style={[styles.screen, rtlDirection]}>
        <View style={[styles.header, rtlRow]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>خدمات الترويج</Text>
            <Text style={styles.headerSub}>عزّز ظهور إعلاناتك بخدمات مدفوعة</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={[styles.freeCard, { backgroundColor: colors.bgElevated, borderColor: colors.borderSoft }]}>
            <View style={[styles.freeIcon, { backgroundColor: `${colors.electric}18` }]}>
              <AppIcon name="checkmark-circle" size={22} color={colors.electric} />
            </View>
            <View style={styles.freeText}>
              <Text style={styles.freeTitle}>حسابك مجاني — كل المزايا الأساسية</Text>
              <Text style={styles.freeSub}>
                {dailyLimit === -1
                  ? 'نشر إعلانات غير محدود في السوق'
                  : `إعلان واحد يومياً في السوق · استخدمت ${dailyUsed} من ${dailyLimit} اليوم`}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>الخدمات المدفوعة</Text>
          <Text style={styles.sectionSub}>ادفع لمرة واحدة — بدون اشتراك شهري</Text>

          {loadingPlans ? (
            <ActivityIndicator color={colors.electric} style={{ marginVertical: spacing.lg }} />
          ) : (
            <>
              <View style={[styles.pricingTable, { borderColor: colors.borderSoft, backgroundColor: colors.bgElevated }]}>
                <View style={[styles.pricingHeaderRow, rtlRow, { borderBottomColor: colors.borderHairline }]}>
                  <Text style={[styles.pricingHeadCell, styles.pricingServiceCol, rtlText]}>الخدمة</Text>
                  <Text style={styles.pricingHeadCell}>يوم</Text>
                  <Text style={styles.pricingHeadCell}>٣ أيام</Text>
                  <Text style={styles.pricingHeadCell}>٧ أيام</Text>
                </View>
                {pricingMatrix.map((row) => {
                  const accent =
                    row.key === 'featured'
                      ? colors.gold
                      : row.key === 'promotion'
                        ? '#7C3AED'
                        : colors.electric;
                  return (
                    <View
                      key={row.key}
                      style={[styles.pricingRow, rtlRow, { borderBottomColor: colors.borderHairline }]}
                    >
                      <View style={[styles.pricingServiceCol, rtlRow]}>
                        <Text style={styles.pricingEmoji}>{row.meta.emoji}</Text>
                        <Text style={[styles.pricingServiceLabel, rtlText, { color: colors.textPrimary }]}>
                          {row.meta.title.replace(' الإعلان', '').replace('روّج إعلانك', 'ترويج')}
                        </Text>
                      </View>
                      {row.prices.map((price, idx) => (
                        <Text key={idx} style={[styles.pricingPrice, { color: accent }]}>
                          {typeof price === 'number' ? `${price} ر.س` : price}
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </View>

              <View style={styles.servicesGrid}>
                {SERVICE_TYPE_ORDER.map((key) => {
                  const meta = BOOST_TYPE_META[key];
                  const options =
                    key === 'promotion'
                      ? promotionPlans
                      : plans[key] ?? FALLBACK_BOOST_PLANS[key];
                  const fromPrice = options[0]?.amount;
                  const accent =
                    key === 'featured'
                      ? colors.gold
                      : key === 'promotion'
                        ? '#7C3AED'
                        : colors.electric;

                  return (
                    <Pressable
                      key={key}
                      onPress={() => {
                        if (myListings[0]) openBoost(myListings[0].id, key);
                      }}
                      style={[
                        styles.serviceCard,
                        {
                          backgroundColor: colors.bgElevated,
                          borderColor: key === 'promotion' ? '#7C3AED44' : colors.borderSoft,
                        },
                      ]}
                    >
                      <View style={[styles.serviceIcon, { backgroundColor: `${accent}18` }]}>
                        <AppIcon name={meta.icon} size={22} color={accent} />
                      </View>
                      <Text style={styles.serviceTitle}>{meta.title}</Text>
                      <Text style={styles.serviceDesc}>{meta.desc}</Text>
                      <Text style={[styles.fromPrice, { color: accent }]}>
                        من {fromPrice} ر.س
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>روّج إعلانك</Text>
          <Text style={styles.sectionSub}>اختر إعلاناً لتطبيق التثبيت أو التمييز أو الترويج</Text>

          {loadingListings ? (
            <ActivityIndicator color={colors.electric} style={{ marginVertical: spacing.lg }} />
          ) : myListings.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.borderSoft }]}>
              <AppIcon name="megaphone-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>لا توجد إعلانات بعد</Text>
              <Text style={styles.emptySub}>انشر إعلاناً في السوق ثم عد لترويجه</Text>
              <Pressable
                style={[styles.createBtn, { backgroundColor: colors.electric }]}
                onPress={() => void navigateToCreateListing()}
              >
                <Text style={styles.createBtnText}>إنشاء إعلان</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.listingsList}>
              {myListings.map((listing) => (
                <View
                  key={listing.id}
                  style={[styles.listingRow, { backgroundColor: colors.bgElevated, borderColor: colors.borderSoft }]}
                >
                  <View style={styles.listingMeta}>
                    <Text style={styles.listingTitle} numberOfLines={1}>
                      {listing.arabicTitle || listing.title}
                    </Text>
                    <View style={[styles.listingBadges, rtlRow]}>
                      {listing.pinned ? (
                        <View style={[styles.badge, { backgroundColor: `${colors.electric}18` }]}>
                          <Text style={[styles.badgeText, { color: colors.electric }]}>مثبّت</Text>
                        </View>
                      ) : null}
                      {listing.featured ? (
                        <View style={[styles.badge, { backgroundColor: `${colors.gold}18` }]}>
                          <Text style={[styles.badgeText, { color: colors.gold }]}>مميّز</Text>
                        </View>
                      ) : null}
                      {listing.promoted ? (
                        <View style={[styles.badge, { backgroundColor: '#7C3AED18' }]}>
                          <Text style={[styles.badgeText, { color: '#7C3AED' }]}>مروّج</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View style={[styles.listingActions, rtlRow]}>
                    {listing.promoted ? (
                      <Pressable
                        style={[styles.statsBtn, { borderColor: colors.borderSoft }]}
                        onPress={() => setStatsListingId(listing.id)}
                      >
                        <AppIcon name="stats-chart-outline" size={16} color="#7C3AED" />
                      </Pressable>
                    ) : null}
                    <Pressable
                      style={[styles.promoteBtn, { backgroundColor: colors.electric }]}
                      onPress={() => openBoost(listing.id, 'promotion')}
                    >
                      <AppIcon name="rocket-outline" size={16} color="#fff" />
                      <Text style={styles.promoteBtnText}>ترويج</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.paymentBadge, rtlRow, { backgroundColor: colors.bgElevated, borderColor: colors.borderSoft }]}>
            <AppIcon name="shield-checkmark" size={18} color={colors.success} />
            <Text style={styles.paymentBadgeText}>
              مدفوعات آمنة عبر Network International · مدى · فيزا · Apple Pay
            </Text>
          </View>

          <View style={{ height: spacing.xl }} />
        </ScrollView>

        {boostListingId ? (
          <ListingBoostSheet
            visible
            listingId={boostListingId}
            initialBoostType={initialBoostType}
            listingFeatured={selectedListing?.featured ?? false}
            listingPinned={selectedListing?.pinned ?? false}
            onClose={() => setBoostListingId(null)}
            onPlanPromoteSuccess={() => void loadListings()}
          />
        ) : null}

        <PromotionStatsSheet
          visible={!!statsListingId}
          listingId={statsListingId}
          listingTitle={
            myListings.find((l) => l.id === statsListingId)?.arabicTitle ??
            myListings.find((l) => l.id === statsListingId)?.title
          }
          onClose={() => setStatsListingId(null)}
        />
      </View>
    </ScreenScaffold>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1 },
    header: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
    headerSpacer: { width: 40 },
    headerTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    headerSub: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.sm,
    },
    freeCard: {
      ...rtlRow,
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: spacing.sm,
    },
    freeIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    freeText: { flex: 1, gap: 4 },
    freeTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      textAlign: 'right',
    },
    freeSub: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'right',
      lineHeight: 20,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      textAlign: 'right',
      marginTop: spacing.md,
    },
    sectionSub: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'right',
      marginBottom: spacing.sm,
    },
    servicesGrid: { gap: spacing.sm, marginBottom: spacing.sm },
    pricingTable: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    pricingHeaderRow: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pricingRow: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
    },
    pricingHeadCell: {
      ...typography.caption,
      fontWeight: '700',
      color: colors.textMuted,
      width: 56,
      textAlign: 'center',
    },
    pricingServiceCol: {
      flex: 1,
      gap: 6,
      alignItems: 'center',
    },
    pricingEmoji: { fontSize: 16 },
    pricingServiceLabel: {
      ...typography.caption,
      fontWeight: '700',
      flex: 1,
      textAlign: 'right',
    },
    pricingPrice: {
      ...typography.caption,
      fontWeight: '800',
      width: 56,
      textAlign: 'center',
    },
    fromPrice: {
      ...typography.caption,
      fontWeight: '800',
      marginTop: spacing.xs,
      textAlign: 'right',
    },
    serviceCard: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      padding: spacing.md,
      gap: spacing.sm,
    },
    serviceIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-end',
    },
    serviceTitle: {
      ...typography.bodyStrong,
      fontSize: 17,
      color: colors.textPrimary,
      textAlign: 'right',
    },
    serviceDesc: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'right',
      lineHeight: 20,
    },
    priceRow: {
      ...rtlRow,
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: 4,
    },
    priceChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      alignItems: 'center',
      minWidth: 72,
    },
    priceChipLabel: {
      ...typography.micro,
      color: colors.textMuted,
    },
    priceChipValue: {
      ...typography.bodyStrong,
      fontWeight: '800',
      marginTop: 2,
    },
    listingsList: { gap: spacing.sm },
    listingRow: {
      ...rtlRow,
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
    },
    listingActions: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    statsBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgSurface,
    },
    listingMeta: { flex: 1, gap: 6 },
    listingTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      textAlign: 'right',
    },
    listingBadges: { gap: 6 },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    badgeText: {
      ...typography.micro,
      fontWeight: '700',
    },
    promoteBtn: {
      ...rtlRow,
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
    },
    promoteBtnText: {
      ...typography.caption,
      color: '#fff',
      fontWeight: '800',
    },
    emptyBox: {
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.xl,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderStyle: 'dashed',
    },
    emptyTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    emptySub: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
    },
    createBtn: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      borderRadius: 12,
    },
    createBtnText: {
      ...typography.bodyStrong,
      color: '#fff',
      fontWeight: '700',
    },
    paymentBadge: {
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: spacing.lg,
    },
    paymentBadgeText: {
      ...typography.caption,
      color: colors.textMuted,
      flex: 1,
      lineHeight: 20,
      textAlign: 'right',
    },
  });
}
