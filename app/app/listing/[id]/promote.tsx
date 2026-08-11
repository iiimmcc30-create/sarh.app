import { ListingBoostTitleIcons } from '@/components/listing/ListingBoostTitleIcons';
import { Image, uriSource } from '@/components/ui/AppImage';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { rtlBackIcon, getRtlDirection, getRtlRow, getRtlText } from '@/lib/rtl';
import { launchPaymentCheckout } from '@/services/payments';
import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';
import type { Listing } from '@/services/types';
import {
  PROMOTE_AMOUNT_DEFAULT,
  PROMOTE_AMOUNT_MAX,
  PROMOTE_AMOUNT_MIN,
  PROMOTE_DURATION_HOURS_DEFAULT,
  PROMOTE_DURATION_HOURS_MAX,
  PROMOTE_DURATION_HOURS_MIN,
  PROMOTE_GOAL_OPTIONS,
  buildPromoteCheckoutPayload,
  clampPromoteAmount,
  clampPromoteDurationHours,
  estimatePromotionReach,
  formatPromoteAmount,
  formatPromoteHours,
  formatReachEstimate,
  goalFromBoostType,
  initiatePromotePayment,
  parsePromoteAmountInput,
  parsePromoteDurationInput,
  resolvePromoteAmount,
  validatePromoteForm,
  type PromotionGoal,
  type ReachEstimate,
  computeVisibilityMinPrice,
} from '@/services/listingPromote';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function goalAccentColor(
  accent: 'electric' | 'gold' | 'promotion',
  colors: ThemeColors,
): string {
  if (accent === 'gold') return colors.gold;
  if (accent === 'promotion') return '#7C3AED';
  return colors.electric;
}

function PromoteValueDisplay({
  value,
  styles,
}: {
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.04, duration: 90, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [scale, value]);

  return (
    <Animated.Text style={[styles.sliderValue, { transform: [{ scale }] }]}>
      {value}
    </Animated.Text>
  );
}

export default function ListingPromoteScreen() {
  const { id, goal: goalParam } = useLocalSearchParams<{ id: string; goal?: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  const initialGoal = goalFromBoostType(goalParam ?? null);

  const [goal, setGoal] = useState<PromotionGoal | null>(initialGoal);
  const [amount, setAmount] = useState(PROMOTE_AMOUNT_DEFAULT);
  const [durationHours, setDurationHours] = useState(PROMOTE_DURATION_HOURS_DEFAULT);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customAmountOpen, setCustomAmountOpen] = useState(false);
  const [customDurationOpen, setCustomDurationOpen] = useState(false);
  const [customAmountDraft, setCustomAmountDraft] = useState(String(PROMOTE_AMOUNT_DEFAULT));
  const [customDurationDraft, setCustomDurationDraft] = useState(
    String(PROMOTE_DURATION_HOURS_DEFAULT),
  );
  const [listing, setListing] = useState<Listing | null>(null);
  const [listingLoading, setListingLoading] = useState(true);

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
    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  const listingTitle = listing?.arabicTitle || listing?.title || 'إعلانك';
  const listingThumb = listing?.images?.[0];

  const isVisibility = goal === 'visibility';
  const isDurationPriced = goal === 'pinned' || goal === 'featured';

  // Compute the minimum required budget for visibility based on duration
  const visibilityMinPrice = useMemo(() => {
    if (!isVisibility) return PROMOTE_AMOUNT_MIN;
    return computeVisibilityMinPrice(durationHours);
  }, [isVisibility, durationHours]);

  // Auto-bump budget to minimum when duration changes
  useEffect(() => {
    if (!isVisibility) return;
    const minPrice = computeVisibilityMinPrice(durationHours);
    setAmount((prev) => Math.max(prev, minPrice));
  }, [isVisibility, durationHours]);

  const totalAmount = useMemo(() => {
    if (!goal) return 0;
    return resolvePromoteAmount(goal, durationHours, amount);
  }, [goal, durationHours, amount]);

  const reachEstimate: ReachEstimate | null = useMemo(() => {
    if (!isVisibility) return null;
    return estimatePromotionReach(totalAmount, durationHours);
  }, [isVisibility, totalAmount, durationHours]);

  const validationError = useMemo(
    () => validatePromoteForm(goal, amount, durationHours),
    [goal, amount, durationHours],
  );

  const checkoutPayload = useMemo(() => {
    if (!id || !goal) return null;
    return buildPromoteCheckoutPayload(id, goal, amount, durationHours);
  }, [amount, durationHours, goal, id]);

  const canPay = Boolean(accessToken && checkoutPayload && !validationError && !processing);

  const handlePay = useCallback(async () => {
    if (!accessToken || !checkoutPayload || validationError) return;
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
  }, [accessToken, checkoutPayload, validationError]);

  const applyCustomAmount = () => {
    const parsed = parsePromoteAmountInput(customAmountDraft);
    if (parsed == null) {
      Alert.alert('مبلغ غير صالح', `أدخل مبلغاً بين ${visibilityMinPrice} و ${PROMOTE_AMOUNT_MAX} ريال`);
      return;
    }
    const enforced = Math.max(parsed, visibilityMinPrice);
    setAmount(enforced);
    setCustomAmountOpen(false);
    Keyboard.dismiss();
  };

  const applyCustomDuration = () => {
    const parsed = parsePromoteDurationInput(customDurationDraft);
    if (parsed == null) {
      Alert.alert(
        'مدة غير صالحة',
        `أدخل مدة بين ${PROMOTE_DURATION_HOURS_MIN} و ${PROMOTE_DURATION_HOURS_MAX} ساعة`,
      );
      return;
    }
    setDurationHours(parsed);
    setCustomDurationOpen(false);
    Keyboard.dismiss();
  };

  if (!id) {
    return (
      <ScreenScaffold>
        <View style={styles.centered}>
          <Text style={styles.errorText}>معرّف الإعلان غير متوفر</Text>
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold edges={['top']}>
      <KeyboardAvoidingView
        style={[styles.flex, getRtlDirection()]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, getRtlRow()]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.pageTitle}>الترويج</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.listingHero}>
            <View style={styles.listingHeroThumb}>
              {listingThumb ? (
                <Image source={uriSource(listingThumb)} style={styles.listingHeroImg} contentFit="cover" />
              ) : (
                <View style={styles.listingHeroPlaceholder}>
                  <AppIcon name="image-outline" size={24} color={colors.textMuted} />
                </View>
              )}
            </View>
            <View style={styles.listingHeroBody}>
              {listingLoading ? (
                <ActivityIndicator color={colors.electric} size="small" />
              ) : (
                <>
                  <View style={[styles.listingHeroTitleRow, getRtlRow()]}>
                    <Text style={styles.listingHeroTitle} numberOfLines={2}>
                      {listingTitle}
                    </Text>
                    <ListingBoostTitleIcons
                      pinned={listing?.pinned}
                      featured={listing?.featured}
                    />
                  </View>
                  {listing?.price && listing.price > 0 ? (
                    <Text style={styles.listingHeroPrice}>
                      {listing.price.toLocaleString('ar-SA')} {listing.currency || 'SAR'}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.rtlTextShell}>
              <Text style={[styles.sectionTitle, styles.sectionTitleBlock]}>اختيار الهدف</Text>
            </View>
            <View style={styles.rtlTextShell}>
              <Text style={styles.sectionHint}>حدّد ما تريد تحقيقه من الترويج</Text>
            </View>
            <View style={styles.goalList}>
              {PROMOTE_GOAL_OPTIONS.map((option) => {
                const selected = goal === option.key;
                const accent = goalAccentColor(option.accent, colors);
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => {
                      setGoal(option.key);
                      setError(null);
                    }}
                    style={[
                      styles.goalCard,
                      selected && { borderColor: accent, backgroundColor: `${accent}10` },
                    ]}
                  >
                    <View style={[styles.goalTop, getRtlRow()]}>
                      <View
                        style={[
                          styles.radioOuter,
                          selected && { borderColor: accent },
                        ]}
                      >
                        {selected ? <View style={[styles.radioInner, { backgroundColor: accent }]} /> : null}
                      </View>
                      <View style={[styles.goalIconWrap, selected && { backgroundColor: `${accent}18` }]}>
                        <AppIcon
                          name={option.icon}
                          size={20}
                          color={selected ? accent : colors.textMuted}
                        />
                      </View>
                      <View style={styles.goalTextWrap}>
                        <View style={styles.rtlTextShell}>
                          <Text style={[styles.goalTitle, selected && { color: accent }]}>
                            {option.title}
                          </Text>
                        </View>
                        <View style={styles.rtlTextShell}>
                          <Text style={styles.goalDesc}>{option.desc}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.goalPreviewTag, getRtlRow()]}>
                      {option.key === 'visibility' ? (
                        <>
                          <AppIcon name="trending-up-outline" size={13} color="#7C3AED" />
                          <View style={styles.goalPreviewTextShell}>
                            <Text style={styles.goalPreviewText}>بدون تغيير على شكل الإعلان</Text>
                          </View>
                        </>
                      ) : option.key === 'pinned' ? (
                        <>
                          <View style={[styles.goalPreviewIcon, { backgroundColor: `${colors.electric}18` }]}>
                            <AppIcon name="pin" size={11} color={colors.electric} />
                          </View>
                          <View style={styles.goalPreviewTextShell}>
                            <Text style={styles.goalPreviewText}>دبوس بجانب العنوان</Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <View style={[styles.goalPreviewIcon, { backgroundColor: `${colors.gold}30` }]}>
                            <AppIcon name="star" size={11} color="#1A1300" />
                          </View>
                          <View style={styles.goalPreviewTextShell}>
                            <Text style={styles.goalPreviewText}>نجمة ذهبية بجانب العنوان</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {isVisibility ? (
            <View style={styles.sliderCard}>
              <View style={[styles.sectionHeaderRow, getRtlRow()]}>
                <Text style={styles.sectionTitle}>الميزانية</Text>
                <Pressable
                  onPress={() => {
                    setCustomAmountDraft(String(amount));
                    setCustomAmountOpen(true);
                  }}
                  hitSlop={8}
                  style={[styles.customBtn, getRtlRow()]}
                >
                  <AppIcon name="create-outline" size={15} color={colors.electric} />
                  <Text style={styles.customBtnText}>مبلغ مخصص</Text>
                </Pressable>
              </View>
              <PromoteValueDisplay value={formatPromoteAmount(amount)} styles={styles} />
              {visibilityMinPrice > PROMOTE_AMOUNT_MIN ? (
                <Text style={styles.minBudgetHint}>
                  الحد الأدنى للميزانية لهذه المدة: {formatPromoteAmount(visibilityMinPrice)}
                </Text>
              ) : null}
              <Slider
                style={styles.slider}
                minimumValue={visibilityMinPrice}
                maximumValue={PROMOTE_AMOUNT_MAX}
                step={1}
                value={Math.max(amount, visibilityMinPrice)}
                onValueChange={(v) => setAmount(Math.max(visibilityMinPrice, Math.round(v)))}
                minimumTrackTintColor="#7C3AED"
                maximumTrackTintColor={colors.borderSoft}
                thumbTintColor="#7C3AED"
              />
              <View style={[styles.sliderBounds, getRtlRow()]}>
                <Text style={styles.sliderBoundText}>{formatPromoteAmount(visibilityMinPrice)}</Text>
                <Text style={styles.sliderBoundText}>{PROMOTE_AMOUNT_MAX} ر.س</Text>
              </View>
            </View>
          ) : null}

          {goal ? (
            <View style={styles.sliderCard}>
              <View style={[styles.sectionHeaderRow, getRtlRow()]}>
                <Text style={styles.sectionTitle}>المدة</Text>
                <Pressable
                  onPress={() => {
                    setCustomDurationDraft(String(durationHours));
                    setCustomDurationOpen(true);
                  }}
                  hitSlop={8}
                  style={[styles.customBtn, getRtlRow()]}
                >
                  <AppIcon name="create-outline" size={15} color={colors.electric} />
                  <Text style={styles.customBtnText}>مدة مخصصة</Text>
                </Pressable>
              </View>
              <PromoteValueDisplay value={formatPromoteHours(durationHours)} styles={styles} />
              <Slider
                style={styles.slider}
                minimumValue={PROMOTE_DURATION_HOURS_MIN}
                maximumValue={PROMOTE_DURATION_HOURS_MAX}
                step={1}
                value={durationHours}
                onValueChange={(v) => setDurationHours(clampPromoteDurationHours(v))}
                minimumTrackTintColor={colors.electric}
                maximumTrackTintColor={colors.borderSoft}
                thumbTintColor={colors.electricBright}
              />
              <View style={[styles.sliderBounds, getRtlRow()]}>
                <Text style={styles.sliderBoundText}>{PROMOTE_DURATION_HOURS_MIN} ساعة</Text>
                <Text style={styles.sliderBoundText}>{PROMOTE_DURATION_HOURS_MAX} ساعة</Text>
              </View>
            </View>
          ) : null}

          {isVisibility && reachEstimate ? (
            <View style={styles.reachCard}>
              <View style={[styles.reachHeader, getRtlRow()]}>
                <AppIcon name="trending-up-outline" size={18} color="#7C3AED" />
                <Text style={styles.reachTitle}>تقدير الوصول</Text>
              </View>
              <Text style={styles.reachValue}>
                متوقع وصول إعلانك إلى {formatReachEstimate(reachEstimate)}
              </Text>
              <Text style={styles.reachHint}>
                تقدير تقريبي يعتمد على الميزانية والمدة — قد يختلف حسب نشاط السوق
              </Text>
            </View>
          ) : null}

          {isDurationPriced && goal ? (
            <View style={styles.priceCard}>
              <Text style={styles.priceCardLabel}>السعر حسب المدة</Text>
              <Text style={styles.priceCardValue}>{formatPromoteAmount(totalAmount)}</Text>
              <Text style={styles.priceCardHint}>
                يُحسب السعر تلقائياً من النظام — لا حاجة لتحديد المبلغ
              </Text>
            </View>
          ) : null}

          {validationError ? (
            <Text style={styles.validationText}>{validationError}</Text>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
          <View style={[styles.bottomInner, getRtlRow()]}>
            <View style={styles.totalBlock}>
              <View style={styles.rtlTextShell}>
                <Text style={styles.totalLabel}>الإجمالي</Text>
              </View>
              <View style={styles.rtlTextShell}>
                <Text style={styles.totalValue}>{formatPromoteAmount(totalAmount)}</Text>
              </View>
            </View>
            <View style={styles.payBtnWrap}>
              <PrimaryButton
                title="الدفع"
                onPress={handlePay}
                disabled={!canPay}
                loading={processing}
                fullWidth
              />
            </View>
          </View>
        </SafeAreaView>

        <Modal visible={customAmountOpen} transparent animationType="fade" onRequestClose={() => setCustomAmountOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setCustomAmountOpen(false)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>مبلغ مخصص</Text>
              <TextInput
                value={customAmountDraft}
                onChangeText={setCustomAmountDraft}
                keyboardType="number-pad"
                style={[styles.modalInput, getRtlText()]}
                placeholder={`${PROMOTE_AMOUNT_MIN} - ${PROMOTE_AMOUNT_MAX}`}
                placeholderTextColor={colors.textMuted}
              />
              <PrimaryButton title="تطبيق" onPress={applyCustomAmount} fullWidth />
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={customDurationOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCustomDurationOpen(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setCustomDurationOpen(false)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>مدة مخصصة (ساعات)</Text>
              <TextInput
                value={customDurationDraft}
                onChangeText={setCustomDurationDraft}
                keyboardType="number-pad"
                style={[styles.modalInput, getRtlText()]}
                placeholder={`${PROMOTE_DURATION_HOURS_MIN} - ${PROMOTE_DURATION_HOURS_MAX}`}
                placeholderTextColor={colors.textMuted}
              />
              <PrimaryButton title="تطبيق" onPress={applyCustomDuration} fullWidth />
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </ScreenScaffold>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSpacer: { width: 40 },
    pageTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      fontWeight: '600',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 140,
      gap: spacing.lg,
    },
    listingHero: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: colors.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    listingHeroThumb: {
      width: 64,
      height: 64,
      borderRadius: radius.lg,
      overflow: 'hidden',
      flexShrink: 0,
    },
    listingHeroImg: {
      width: '100%',
      height: '100%',
    },
    listingHeroPlaceholder: {
      flex: 1,
      backgroundColor: colors.bgDeep,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listingHeroBody: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    listingHeroTitleRow: {
      alignItems: 'flex-start',
      gap: 6,
    },
    listingHeroTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      ...getRtlText(),
      ...getRtlText(),
      flex: 1,
      lineHeight: 22,
    },
    listingHeroPrice: {
      ...typography.caption,
      color: colors.textBrandStrong,
      fontWeight: '600',
      ...getRtlText(),
      ...getRtlText(),
    },
    section: {
      gap: spacing.sm,
    },
    /** Physical LTR shell — same as listing title / SidebarMenuItem. */
    rtlTextShell: {
      width: '100%',
      direction: 'ltr',
    },
    sectionHint: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    sliderCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    sectionHeaderRow: {
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      fontWeight: '600',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    sectionTitleBlock: {
      width: '100%',
    },
    customBtn: {
      alignItems: 'center',
      gap: 4,
    },
    customBtnText: {
      ...typography.caption,
      color: colors.electric,
      fontWeight: '600',
    },
    goalList: { gap: spacing.sm },
    goalCard: {
      borderRadius: radius.xl,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      padding: spacing.md,
    },
    goalTop: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.borderMid,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    goalIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalTextWrap: { flex: 1, gap: 4, minWidth: 0 },
    goalTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    goalDesc: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 18,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    goalPreviewTag: {
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.xs,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderHairline,
    },
    goalPreviewIcon: {
      width: 20,
      height: 20,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalPreviewTextShell: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
    },
    goalPreviewText: {
      ...typography.micro,
      color: colors.textMuted,
      fontWeight: '600',
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    sliderValue: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '600',
      color: colors.textBrandStrong,
      ...getRtlText(),
      ...getRtlText(),
    },
    slider: {
      width: '100%',
      height: 40,
    },
    sliderBounds: {
      justifyContent: 'space-between',
    },
    sliderBoundText: {
      ...typography.micro,
      color: colors.textMuted,
    },
    validationText: {
      ...typography.caption,
      color: colors.warning,
      ...getRtlText(),
      ...getRtlText(),
    },
    errorText: {
      ...typography.caption,
      color: colors.danger,
      ...getRtlText(),
      ...getRtlText(),
    },
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
    totalBlock: {
      flex: 1,
      gap: 2,
    },
    totalLabel: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    totalValue: {
      ...typography.h3,
      color: colors.textBrandStrong,
      fontWeight: '600',
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    payBtnWrap: {
      flex: 1.2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.bgOverlay,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      borderRadius: radius.xl,
      backgroundColor: colors.bgSurface,
      padding: spacing.lg,
      gap: spacing.md,
    },
    modalTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      ...getRtlText(),
      ...getRtlText(),
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.textPrimary,
      backgroundColor: colors.bgElevated,
      fontSize: 18,
      fontWeight: '600' as const,
    },
    minBudgetHint: {
      ...typography.caption,
      color: '#7C3AED',
      fontWeight: '600' as const,
      ...getRtlText(),
      ...getRtlText(),
    },
    reachCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: '#7C3AED12',
      borderWidth: 1,
      borderColor: '#7C3AED40',
    },
    reachHeader: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    reachTitle: {
      ...typography.bodyStrong,
      color: '#7C3AED',
      fontWeight: '600',
      ...getRtlText(),
      ...getRtlText(),
    },
    reachValue: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      fontWeight: '600',
      lineHeight: 24,
      ...getRtlText(),
      ...getRtlText(),
    },
    reachHint: {
      ...typography.micro,
      color: colors.textMuted,
      lineHeight: 18,
      ...getRtlText(),
      ...getRtlText(),
    },
    priceCard: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      alignItems: 'center',
    },
    priceCardLabel: {
      ...typography.caption,
      color: colors.textMuted,
      ...getRtlText(),
      ...getRtlText(),
    },
    priceCardValue: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '600',
      color: colors.textBrandStrong,
      ...getRtlText(),
      ...getRtlText(),
    },
    priceCardHint: {
      ...typography.micro,
      color: colors.textMuted,
      ...getRtlText(),
      ...getRtlText(),
    },
  });
}
