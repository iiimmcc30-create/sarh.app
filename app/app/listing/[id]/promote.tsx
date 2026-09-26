import { ListingBoostTitleIcons } from '@/components/listing/ListingBoostTitleIcons';
import { Image, uriSource } from '@/components/ui/AppImage';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { launchPaymentCheckout } from '@/services/payments';
import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';
import type { Listing } from '@/services/types';
import {
  buildPromoteCheckoutPayload,
  fetchPromoteQuote,
  formatPromoteAmount,
  goalFromBoostType,
  initiatePromotePayment,
  type PromotionGoal,
} from '@/services/listingPromote';
import { listPromoteCatalogOptions } from '@/services/promoteCatalog';
import { usePaidServices } from '@/hooks/usePaidServices';
import { isPromoteGoalEnabled } from '@/services/paidServices';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText, SarhButton, SarhDivider, resolveSarhChipColors } from '@/design-system/components';
import {
  BottomAction,
  Row,
  Screen,
  ScreenBody,
  Section,
  Stack,
} from '@/design-system/layout';
import { colors, motion, radius, space } from '@/design-system';

type ServiceCopy = {
  goal: PromotionGoal;
  icon: string;
  title: string;
  desc: string;
};

const SERVICE_COPY: ServiceCopy[] = [
  {
    goal: 'featured',
    icon: 'star',
    title: 'تمييز الإعلان',
    desc: 'نجمة ذهبية بجانب العنوان في نتائج البحث',
  },
  {
    goal: 'pinned',
    icon: 'pin',
    title: 'تثبيت الإعلان',
    desc: 'يبقى الإعلان في أعلى القائمة مع دبوس صغير',
  },
  {
    goal: 'visibility',
    icon: 'rocket-outline',
    title: 'ترويج الإعلان',
    desc: 'زيادة قوة الظهور في الخوارزمية بدون تغيير بصري',
  },
];

const BOOST_SUBTITLE = 'خل إعلانك يوصل لعدد أكبر من المهتمين';

/** Layout only — theme colors are read at render from design-system tokens. */
const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center' },
  fill: { flex: 1, minWidth: 0 },
  action: { flex: 1, minWidth: 0 },
  thumb: {
    width: space[64],
    height: space[64],
    borderRadius: radius[12],
    overflow: 'hidden',
  },
  thumbFill: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  radio: {
    width: space[20],
    height: space[20],
    borderRadius: radius[999],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: space[8],
    height: space[8],
    borderRadius: radius[999],
  },
  duration: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius[16],
    paddingVertical: space[16],
    paddingHorizontal: space[12],
    gap: space[4],
  },
});

export default function ListingPromoteScreen() {
  const { id, goal: goalParam } = useLocalSearchParams<{ id: string; goal?: string }>();
  const { accessToken } = useAuth();
  useTheme();

  const { flags: paidFlags, hasAnyBoostService } = usePaidServices();
  const initialGoal = goalFromBoostType(goalParam ?? null);

  const [goal, setGoal] = useState<PromotionGoal | null>(initialGoal);
  const [durationPick, setDurationPick] = useState<{ goal: PromotionGoal; index: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [listing, setListing] = useState<Listing | null>(null);
  const [listingLoading, setListingLoading] = useState(true);

  const goalEnabled = Boolean(goal && hasAnyBoostService && isPromoteGoalEnabled(goal, paidFlags));
  const activeGoal = goalEnabled ? goal : null;
  const selectedDurationIndex =
    durationPick && durationPick.goal === activeGoal ? durationPick.index : null;

  const selectGoal = (next: PromotionGoal) => {
    setGoal(next);
    if (next !== goal) setError(null);
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      // Yield once so the loading flag is not set synchronously inside the effect.
      await Promise.resolve();
      if (cancelled) return;
      setListingLoading(true);
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
    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  const listingTitle = listing?.arabicTitle || listing?.title || '';
  const listingThumb = listing?.images?.[0];

  const enabledServices = useMemo(
    () =>
      SERVICE_COPY.filter((s) => isPromoteGoalEnabled(s.goal, paidFlags)).map((s) => ({
        ...s,
        durations: listPromoteCatalogOptions(s.goal),
      })),
    [paidFlags],
  );

  const selectedService = useMemo(
    () => enabledServices.find((s) => s.goal === activeGoal) ?? null,
    [enabledServices, activeGoal],
  );

  const selectedDuration =
    selectedService && selectedDurationIndex != null
      ? selectedService.durations[selectedDurationIndex] ?? null
      : null;

  useEffect(() => {
    if (!activeGoal || !selectedDuration) return;
    void fetchPromoteQuote(activeGoal, selectedDuration.durationHours).catch(() => {
      /* Catalog amount stays on screen; backend initiate also uses the catalog. */
    });
  }, [activeGoal, selectedDuration]);

  const displayPrice = selectedDuration?.amount ?? null;

  const checkoutPayload = useMemo(() => {
    if (!id || !activeGoal || !selectedDuration) return null;
    return buildPromoteCheckoutPayload(id, activeGoal, selectedDuration.durationHours);
  }, [id, activeGoal, selectedDuration]);

  const canPay = Boolean(
    accessToken && checkoutPayload && !processing && hasAnyBoostService && activeGoal,
  );

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
          promotionAmount: String(result.amount),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر بدء عملية الدفع');
    } finally {
      setProcessing(false);
    }
  }, [accessToken, checkoutPayload]);

  const payTitle =
    displayPrice != null ? `متابعة الدفع · ${formatPromoteAmount(displayPrice)}` : 'متابعة الدفع';

  if (!id) {
    return (
      <Screen>
        <ScreenHeader variant="screen" title="عزّز إعلانك" showBack />
        <ScreenBody scroll={false} padTop="lg" style={styles.centered}>
          <AppText variant="body" color="textMuted">معرّف الإعلان غير متوفر</AppText>
        </ScreenBody>
      </Screen>
    );
  }

  return (
    <Screen keyboard>
      <ScreenHeader variant="screen" title="عزّز إعلانك" showBack />

      <ScreenBody padTop="lg" gap="section" bottomInset="action">
        <Stack gap="sm">
          <AppText variant="bodySmall" color="textSecondary">
            {BOOST_SUBTITLE}
          </AppText>

          {listingLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : listing && listingTitle ? (
            <Row gap="md" align="center">
              <View style={styles.thumb}>
                {listingThumb ? (
                  <Image source={uriSource(listingThumb)} style={styles.thumbFill} contentFit="cover" />
                ) : (
                  <View style={[styles.thumbFill, { backgroundColor: colors.surface }]}>
                    <AppIcon name="image-outline" size={space[20]} color={colors.textMuted} />
                  </View>
                )}
              </View>
              <Stack gap="xs" style={styles.fill}>
                <Row gap="xs" align="center">
                  <AppText variant="bodyMedium" color="textPrimary" numberOfLines={2} style={styles.fill}>
                    {listingTitle}
                  </AppText>
                  <ListingBoostTitleIcons pinned={listing.pinned} featured={listing.featured} />
                </Row>
                {listing.price > 0 ? (
                  <AppText variant="caption" color="primary">
                    {listing.price.toLocaleString('ar-SA')} {listing.currency || 'SAR'}
                  </AppText>
                ) : null}
              </Stack>
            </Row>
          ) : (
            <AppText variant="body" color="textMuted">
              تعذّر تحميل بيانات الإعلان
            </AppText>
          )}
        </Stack>

        {!hasAnyBoostService ? (
          <Row gap="sm" align="start">
            <AppIcon name="information-outline" size={space[16]} color={colors.textMuted} />
            <AppText variant="caption" color="textMuted" style={styles.fill}>
              خدمات التعزيز غير مفعّلة حالياً. تواصل مع الإدارة إن لزم.
            </AppText>
          </Row>
        ) : null}

        <Section title="الخدمة">
          <View accessibilityRole="radiogroup" accessibilityLabel="الخدمة">
            {enabledServices.map((svc, idx) => {
              const selected = activeGoal === svc.goal;
              return (
                <View key={svc.goal}>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityLabel={svc.title}
                    accessibilityHint={svc.desc}
                    accessibilityState={{ selected }}
                    onPress={() => selectGoal(svc.goal)}
                    style={({ pressed }) => ({
                      opacity: pressed ? motion.opacity.pressed : 1,
                      transform: [{ scale: pressed ? motion.pressScale : 1 }],
                    })}
                  >
                    <Row gap="md" align="center" style={{ minHeight: space[48] + space[8], paddingVertical: space[8] }}>
                      <View
                        style={[
                          styles.radio,
                          { borderColor: selected ? colors.primary : colors.border },
                        ]}
                      >
                        {selected ? (
                          <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                        ) : null}
                      </View>
                      <AppIcon
                        name={svc.icon}
                        size={space[20]}
                        color={selected ? colors.primary : colors.textMuted}
                      />
                      <Stack gap="none" style={styles.fill}>
                        <AppText variant="bodyMedium" color={selected ? 'textPrimary' : 'textSecondary'}>
                          {svc.title}
                        </AppText>
                        <AppText variant="caption" color="textMuted" numberOfLines={1}>
                          {svc.desc}
                        </AppText>
                      </Stack>
                    </Row>
                  </Pressable>
                  {idx < enabledServices.length - 1 ? <SarhDivider /> : null}
                </View>
              );
            })}
          </View>
        </Section>

        {selectedService ? (
          <Section title="المدة">
            <View accessibilityRole="radiogroup" accessibilityLabel="المدة">
              <Row gap="sm" align="stretch">
              {selectedService.durations.map((dur, i) => {
                const active = selectedDurationIndex === i;
                const palette = resolveSarhChipColors(active);
                return (
                  <Pressable
                    key={dur.durationHours}
                    accessibilityRole="radio"
                    accessibilityLabel={`${dur.labelAr} ${formatPromoteAmount(dur.amount)}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      if (!activeGoal) return;
                      setDurationPick({ goal: activeGoal, index: i });
                    }}
                    style={({ pressed }) => [
                      styles.duration,
                      {
                        backgroundColor: palette.backgroundColor,
                        borderColor: palette.borderColor,
                        opacity: pressed ? motion.opacity.pressed : 1,
                        transform: [{ scale: pressed ? motion.pressScale : 1 }],
                      },
                    ]}
                  >
                    <AppText
                      variant="bodyMedium"
                      color={palette.text}
                      align="center"
                      style={palette.textOverride ? { color: palette.textOverride } : undefined}
                    >
                      {dur.labelAr}
                    </AppText>
                    <AppText
                      variant="price"
                      color={palette.text}
                      align="center"
                      style={palette.textOverride ? { color: palette.textOverride } : undefined}
                    >
                      {formatPromoteAmount(dur.amount)}
                    </AppText>
                  </Pressable>
                );
              })}
              </Row>
            </View>
          </Section>
        ) : null}

        {error ? (
          <Row gap="sm" align="start">
            <AppIcon name="alert-circle-outline" size={space[16]} color={colors.danger} />
            <AppText variant="caption" color="danger" style={styles.fill}>{error}</AppText>
          </Row>
        ) : null}
      </ScreenBody>

      <BottomAction>
        <Stack gap="sm" style={styles.action}>
          {selectedService && selectedDuration && displayPrice != null ? (
            <Row justify="between" align="center">
              <Stack gap="none" fill>
                <AppText variant="bodyMedium" color="textPrimary" numberOfLines={1}>
                  {selectedService.title}
                </AppText>
                <AppText variant="caption" color="textMuted" numberOfLines={1}>
                  {selectedDuration.labelAr}
                </AppText>
              </Stack>
              <AppText variant="price" color="textPrimary">
                {formatPromoteAmount(displayPrice)}
              </AppText>
            </Row>
          ) : null}
          <SarhButton
            title={payTitle}
            onPress={handlePay}
            disabled={!canPay}
            loading={processing}
            fullWidth
          />
        </Stack>
      </BottomAction>
    </Screen>
  );
}
