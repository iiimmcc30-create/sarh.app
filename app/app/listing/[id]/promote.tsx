import { ListingBoostTitleIcons } from '@/components/listing/ListingBoostTitleIcons';
import { Image, uriSource } from '@/components/ui/AppImage';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow } from '@/lib/rtl';
import { launchPaymentCheckout } from '@/services/payments';
import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';
import type { Listing } from '@/services/types';
import {
  buildPromoteCheckoutPayload,
  goalFromBoostType,
  initiatePromotePayment,
  type PromotionGoal,
} from '@/services/listingPromote';
import { usePaidServices } from '@/hooks/usePaidServices';
import {
  firstEnabledPromoteGoal,
  isPromoteGoalEnabled,
} from '@/services/paidServices';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, SarhButton, SarhDivider } from '@/design-system/components';

// ─── Fixed service definitions ──────────────────────────────────────────────
// Prices are agreed UI display values; server is authoritative for final charge.

type DurationOption = { label: string; hours: number; price: number };

type ServiceDef = {
  goal: PromotionGoal;
  icon: string;
  title: string;
  desc: string;
  durations: [DurationOption, DurationOption];
};

const SERVICES: ServiceDef[] = [
  {
    goal: 'featured',
    icon: 'star',
    title: 'تمييز الإعلان',
    desc: 'نجمة ذهبية بجانب العنوان في نتائج البحث',
    durations: [
      { label: 'يوم واحد', hours: 24, price: 9 },
      { label: '٣ أيام', hours: 72, price: 25 },
    ],
  },
  {
    goal: 'pinned',
    icon: 'pin',
    title: 'تثبيت الإعلان',
    desc: 'يبقى الإعلان في أعلى القائمة مع دبوس صغير',
    durations: [
      { label: 'يوم واحد', hours: 24, price: 12 },
      { label: '٣ أيام', hours: 72, price: 29 },
    ],
  },
  {
    goal: 'visibility',
    icon: 'rocket-outline',
    title: 'ترويج الإعلان',
    desc: 'زيادة قوة الظهور في الخوارزمية بدون تغيير بصري',
    durations: [
      { label: 'يوم واحد', hours: 24, price: 19 },
      { label: 'يومين', hours: 48, price: 35 },
    ],
  },
];

// ─── Pulse animation on price change ────────────────────────────────────────
function PriceDisplay({ price, styles }: { price: number; styles: ReturnType<typeof createStyles> }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.06, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 110, useNativeDriver: true }),
    ]).start();
  }, [scale, price]);

  return (
    <Animated.Text style={[styles.priceValue, { transform: [{ scale }] }]}>
      {price} ر.س
    </Animated.Text>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ListingPromoteScreen() {
  const { id, goal: goalParam } = useLocalSearchParams<{ id: string; goal?: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  const { flags: paidFlags, hasAnyBoostService } = usePaidServices();
  const initialGoal = goalFromBoostType(goalParam ?? null);

  const [goal, setGoal] = useState<PromotionGoal | null>(initialGoal);
  const [selectedDurationIndex, setSelectedDurationIndex] = useState<0 | 1>(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [listing, setListing] = useState<Listing | null>(null);
  const [listingLoading, setListingLoading] = useState(true);

  // Sync goal to first enabled when flags load
  useEffect(() => {
    if (!hasAnyBoostService) return;
    if (goal && isPromoteGoalEnabled(goal, paidFlags)) return;
    setGoal(firstEnabledPromoteGoal(paidFlags));
  }, [goal, hasAnyBoostService, paidFlags]);

  // Reset duration when goal changes
  useEffect(() => {
    setSelectedDurationIndex(0);
    setError(null);
  }, [goal]);

  // Fetch listing
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setListingLoading(true);
    void (async () => {
      try {
        const res = await (accessToken
          ? authFetch(`${API_BASE}/api/listings/${id}`)
          : fetch(`${API_BASE}/api/listings/${id}`));
        if (!res.ok) throw new Error('fetch_failed');
        const json = await res.json();
        const raw = json.data;
        if (!cancelled && json.success && raw) {
          setListing({
            id: raw.id,
            title: raw.title,
            arabicTitle: raw.arabicTitle,
            price: raw.price,
            currency: raw.currency || 'SAR',
            category: raw.category,
            breed: raw.breed || '',
            age: raw.age || '',
            location: raw.location,
            arabicLocation: raw.arabicLocation,
            country: raw.country,
            images: raw.images?.length ? raw.images : [],
            description: raw.description,
            arabicDescription: raw.arabicDescription,
            seller: raw.seller,
            featured: raw.featured ?? false,
            pinned: raw.pinned ?? false,
            promoted: raw.promoted ?? false,
            postedAt: raw.createdAt,
            createdAt: raw.createdAt,
          } as Listing);
        }
      } catch {
        if (!cancelled) setListing(null);
      } finally {
        if (!cancelled) setListingLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [accessToken, id]);

  const listingTitle = listing?.arabicTitle || listing?.title || 'إعلانك';
  const listingThumb = listing?.images?.[0];

  const enabledServices = useMemo(
    () => SERVICES.filter((s) => isPromoteGoalEnabled(s.goal, paidFlags)),
    [paidFlags],
  );

  const selectedService = useMemo(
    () => SERVICES.find((s) => s.goal === goal) ?? null,
    [goal],
  );

  const selectedDuration = selectedService?.durations[selectedDurationIndex] ?? null;

  const checkoutPayload = useMemo(() => {
    if (!id || !goal || !selectedDuration) return null;
    return buildPromoteCheckoutPayload(id, goal, selectedDuration.price, selectedDuration.hours);
  }, [id, goal, selectedDuration]);

  const canPay = Boolean(accessToken && checkoutPayload && !processing && hasAnyBoostService && goal);

  const handlePay = useCallback(async () => {
    if (!accessToken || !checkoutPayload) return;
    setProcessing(true);
    setError(null);
    try {
      const result = await initiatePromotePayment(accessToken, checkoutPayload);
      await launchPaymentCheckout({
        accessToken,
        paymentId: result.paymentId,
        checkoutUrl: result.checkoutUrl,
        devMode: result.devMode,
        context: checkoutPayload.promotionGoal === 'visibility' ? 'promotion' : 'boost',
        returnParams: {
          listingId: checkoutPayload.adId,
          boostType: checkoutPayload.promotionGoal,
          durationHours: String(checkoutPayload.promotionDurationHours),
          promotionAmount: String(checkoutPayload.promotionAmount),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر بدء عملية الدفع');
    } finally {
      setProcessing(false);
    }
  }, [accessToken, checkoutPayload]);

  if (!id) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="تعزيز سرح" showBack />
        <View style={styles.centered}>
          <AppText variant="body" color="textMuted">معرّف الإعلان غير متوفر</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader title="تعزيز سرح" showBack />

        <AppScrollView contentContainerStyle={styles.scrollContent}>

          {/* Listing hero */}
          <View style={[styles.listingRow, getRtlRow()]}>
            <View style={styles.thumbWrap}>
              {listingThumb ? (
                <Image source={uriSource(listingThumb)} style={styles.thumbImg} contentFit="cover" />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <AppIcon name="image-outline" size={22} color={colors.textMuted} />
                </View>
              )}
            </View>
            <View style={styles.listingBody}>
              {listingLoading ? (
                <ActivityIndicator color={colors.electricBright} size="small" />
              ) : (
                <>
                  <View style={[getRtlRow(), { alignItems: 'flex-start', gap: 6 }]}>
                    <AppText variant="label" color="textPrimary" numberOfLines={2} style={{ flex: 1, lineHeight: 22 }}>{listingTitle}</AppText>
                    <ListingBoostTitleIcons pinned={listing?.pinned} featured={listing?.featured} />
                  </View>
                  {listing?.price && listing.price > 0 ? (
                    <AppText variant="caption" style={styles.listingPrice}>
                      {listing.price.toLocaleString('ar-SA')} {listing.currency || 'SAR'}
                    </AppText>
                  ) : null}
                </>
              )}
            </View>
          </View>

          {/* No services banner */}
          {!hasAnyBoostService ? (
            <View style={styles.disabledBanner}>
              <AppIcon name="information-outline" size={18} color={colors.textMuted} />
              <AppText variant="caption" color="textMuted" style={{ flex: 1 }}>
                خدمات التعزيز غير مفعّلة حالياً. تواصل مع الإدارة إن لزم.
              </AppText>
            </View>
          ) : null}

          {/* Service selection */}
          <View style={styles.section}>
            <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
              اختر الخدمة
            </AppText>
            {enabledServices.map((svc, idx) => {
              const selected = goal === svc.goal;
              return (
                <View key={svc.goal}>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setGoal(svc.goal)}
                    style={({ pressed }) => [
                      styles.serviceRow,
                      selected && styles.serviceRowSelected,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View style={[getRtlRow(), { alignItems: 'center', flex: 1, gap: spacing.md }]}>
                      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                        {selected ? <View style={styles.radioInner} /> : null}
                      </View>
                      <AppIcon
                        name={svc.icon}
                        size={18}
                        color={selected ? colors.electricBright : colors.textMuted}
                      />
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="label" color={selected ? 'textPrimary' : 'textSecondary'}>
                          {svc.title}
                        </AppText>
                        <AppText variant="caption" color="textMuted" numberOfLines={1}>
                          {svc.desc}
                        </AppText>
                      </View>
                    </View>
                  </Pressable>
                  {idx < enabledServices.length - 1 ? <SarhDivider inset /> : null}
                </View>
              );
            })}
          </View>

          {/* Duration selection */}
          {selectedService ? (
            <View style={styles.section}>
              <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
                اختر المدة
              </AppText>
              <View style={[getRtlRow(), { gap: spacing.sm }]}>
                {selectedService.durations.map((dur, i) => {
                  const active = selectedDurationIndex === i;
                  return (
                    <Pressable
                      key={dur.hours}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setSelectedDurationIndex(i as 0 | 1)}
                      style={({ pressed }) => [
                        styles.durationChip,
                        active && styles.durationChipActive,
                        { opacity: pressed ? 0.75 : 1, flex: 1 },
                      ]}
                    >
                      <AppText
                        variant="label"
                        color={active ? 'textPrimary' : 'textSecondary'}
                        style={{ textAlign: 'center' }}
                      >
                        {dur.label}
                      </AppText>
                      <AppText
                        variant="caption"
                        color={active ? 'textPrimary' : 'textMuted'}
                        style={{ textAlign: 'center', fontWeight: '700' }}
                      >
                        {dur.price} ر.س
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Summary */}
          {selectedService && selectedDuration ? (
            <View style={styles.summarySection}>
              <View style={[getRtlRow(), styles.summaryRow]}>
                <AppText variant="caption" color="textMuted">الخدمة</AppText>
                <AppText variant="label" color="textPrimary">{selectedService.title}</AppText>
              </View>
              <SarhDivider />
              <View style={[getRtlRow(), styles.summaryRow]}>
                <AppText variant="caption" color="textMuted">المدة</AppText>
                <AppText variant="label" color="textPrimary">{selectedDuration.label}</AppText>
              </View>
              <SarhDivider />
              <View style={[getRtlRow(), styles.summaryRow]}>
                <AppText variant="caption" color="textMuted">السعر المتوقع</AppText>
                <PriceDisplay price={selectedDuration.price} styles={styles} />
              </View>
              <View style={styles.serverNote}>
                <AppText variant="micro" color="textMuted" style={{ textAlign: 'center' }}>
                  السعر النهائي يُحدَّد من الخادم عند بدء الدفع
                </AppText>
              </View>
            </View>
          ) : null}

          {/* Validation / error */}
          {error ? (
            <View style={[styles.errorRow, getRtlRow()]}>
              <AppIcon name="alert-circle-outline" size={16} color={colors.danger} />
              <AppText variant="caption" color="danger" style={{ flex: 1 }}>{error}</AppText>
            </View>
          ) : null}

        </AppScrollView>

        {/* Bottom CTA */}
        <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
          <View style={[getRtlRow(), styles.bottomInner]}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" color="textMuted">الإجمالي المتوقع</AppText>
              <AppText variant="heading3" color="textPrimary" style={{ fontWeight: '700' }}>
                {selectedDuration ? `${selectedDuration.price} ر.س` : '—'}
              </AppText>
            </View>
            <View style={{ flex: 1.2 }}>
              <SarhButton
                title="الدفع"
                onPress={handlePay}
                disabled={!canPay}
                loading={processing}
                fullWidth
              />
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    flex: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: 140,
      gap: spacing.lg,
    },

    // Listing hero
    listingRow: {
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: colors.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    thumbWrap: { width: 64, height: 64, borderRadius: radius.lg, overflow: 'hidden', flexShrink: 0 },
    thumbImg: { width: '100%', height: '100%' },
    thumbPlaceholder: {
      flex: 1,
      backgroundColor: colors.bgDeep,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listingBody: { flex: 1, gap: 4, minWidth: 0 },
    listingTitle: {
      flex: 1,
      lineHeight: 22,
    },
    listingPrice: {
      color: colors.textBrandStrong,
      fontWeight: '600',
    },

    // Disabled banner
    disabledBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },

    // Sections
    section: {
      gap: spacing.sm,
    },
    sectionLabel: {
      paddingHorizontal: 2,
    },

    // Service rows
    serviceRow: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    serviceRowSelected: {
      borderColor: colors.electricBright,
      backgroundColor: colors.bgElevated,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.borderMid,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    radioOuterSelected: { borderColor: colors.electricBright },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.electricBright,
    },

    // Duration chips
    durationChip: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.bgSurface,
      alignItems: 'center',
      gap: 4,
    },
    durationChipActive: {
      borderColor: colors.electricBright,
      backgroundColor: colors.bgElevated,
    },

    // Summary
    summarySection: {
      borderRadius: radius.xl,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
    },
    summaryRow: {
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    priceValue: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textBrandStrong,
    },
    serverNote: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      paddingTop: spacing.xs,
    },

    // Error
    errorRow: {
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: `${colors.danger}12`,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.danger}40`,
    },

    // Bottom bar
    bottomBar: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSoft,
      backgroundColor: colors.bgPrimary,
    },
    bottomInner: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.md,
    },
  });
}
