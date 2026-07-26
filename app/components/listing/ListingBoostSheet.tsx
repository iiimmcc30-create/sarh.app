import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { rtlRow, rtlDirection } from '@/lib/rtl';
import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';
import {
  BOOST_TYPE_META,
  BOOST_TYPE_ORDER,
  FALLBACK_BOOST_PLANS,
  type BoostPlansMap,
  type BoostTypeKey,
  fetchBoostPlans,
} from '@/services/listingBoost';
import { launchPaymentCheckout } from '@/services/payments';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const PAYMENT_METHODS = [
  { id: 'mada' as const, icon: '💳', labelAr: 'مدى' },
  { id: 'visa' as const, icon: '💳', labelAr: 'فيزا' },
  { id: 'mastercard' as const, icon: '💳', labelAr: 'ماستركارد' },
  { id: 'apple_pay' as const, icon: '🍎', labelAr: 'Apple Pay' },
  { id: 'stc_pay' as const, icon: '📱', labelAr: 'STC Pay' },
];

type ListingBoostSheetProps = {
  visible: boolean;
  listingId: string;
  onClose: () => void;
  initialBoostType?: BoostTypeKey;
  showPublishBanner?: boolean;
  onSkip?: () => void;
};

export function ListingBoostSheet({
  visible,
  listingId,
  onClose,
  initialBoostType = 'pinned',
  showPublishBanner = false,
  onSkip,
}: ListingBoostSheetProps) {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const { accessToken } = useAuth();

  const [plans, setPlans] = useState<BoostPlansMap>(FALLBACK_BOOST_PLANS);
  const [boostType, setBoostType] = useState<BoostTypeKey>(initialBoostType);
  const [durationDays, setDurationDays] = useState(3);
  const [method, setMethod] = useState<'mada' | 'visa' | 'mastercard' | 'apple_pay' | 'stc_pay'>('mada');
  const [processing, setProcessing] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const typePlans = plans[boostType] ?? FALLBACK_BOOST_PLANS[boostType];
  const selectedPlan =
    typePlans.find((p) => p.durationDays === durationDays) ?? typePlans[0];

  const accentFor = (key: BoostTypeKey) => {
    const meta = BOOST_TYPE_META[key];
    if (meta.accent === 'gold') return { main: colors.gold, bright: colors.gold };
    if (meta.accent === 'royal') return { main: colors.electric, bright: colors.electricBright };
    return { main: colors.electric, bright: colors.electricBright };
  };

  const currentAccent = accentFor(boostType);

  const payGradient = (): [string, string, string] => {
    if (boostType === 'featured') return ['#B8860B', '#FFD700', '#B8860B'];
    if (boostType === 'both') return gradients.royal as [string, string, string];
    return [colors.electric, colors.electricBright, colors.electric];
  };

  useEffect(() => {
    if (!visible) return;
    setBoostType(initialBoostType);
    const defaults = FALLBACK_BOOST_PLANS[initialBoostType];
    setDurationDays(defaults[0]?.durationDays ?? 3);
    void fetchBoostPlans().then(setPlans);
  }, [visible, initialBoostType]);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 68,
        friction: 11,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleSelectType = (key: BoostTypeKey) => {
    setBoostType(key);
    const nextPlans = plans[key] ?? FALLBACK_BOOST_PLANS[key];
    setDurationDays(nextPlans[0]?.durationDays ?? 3);
  };

  const handlePay = async () => {
    if (!accessToken || !selectedPlan) return;
    setProcessing(true);
    try {
      const res = await authFetch(`${API_BASE}/api/listings/${listingId}/boost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boostType,
          durationDays: selectedPlan.durationDays,
          method,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success || !json.data) {
        Alert.alert('فشل', json.messageAr ?? json.message ?? 'تعذّر إطلاق خدمة الترقية');
        return;
      }
      const { checkoutUrl, paymentId, devMode } = json.data as {
        checkoutUrl?: string;
        paymentId?: string;
        devMode?: boolean;
      };
      onClose();
      await launchPaymentCheckout({
        accessToken,
        paymentId,
        checkoutUrl,
        devMode,
        context: 'boost',
        returnParams: {
          listingId,
          boostType,
          durationDays: String(selectedPlan.durationDays),
        },
      });
    } catch {
      Alert.alert('خطأ في الاتصال', 'تعذّر الوصول للخادم');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!processing) onClose();
  }, [processing, onClose]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [420, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <Animated.View
          style={[styles.sheet, rtlDirection, { transform: [{ translateY }] }]}
        >
          <LinearGradient
            colors={[colors.bgPrimary, colors.bgSurface]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={gradients.rim}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rim}
          />

          <View style={[styles.header, rtlRow]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>ترقية الإعلان</Text>
              <Text style={styles.headerSub}>زِد ظهور إعلانك في السوق</Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={10} style={styles.closeBtn}>
              <AppIcon name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {showPublishBanner ? (
              <LinearGradient
                colors={gradients.royal}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.publishBanner}
              >
                <AppIcon name="checkmark-circle" size={28} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.publishBannerTitle}>تم نشر إعلانك بنجاح!</Text>
                  <Text style={styles.publishBannerSub}>
                    اختر ترقية الآن لزيادة المشاهدات والتواصل
                  </Text>
                </View>
              </LinearGradient>
            ) : null}

            <Text style={styles.sectionLabel}>اختر الخدمة</Text>
            <View style={styles.serviceGrid}>
              {BOOST_TYPE_ORDER.map((key) => {
                const meta = BOOST_TYPE_META[key];
                const accent = accentFor(key);
                const selected = boostType === key;
                const minPrice = (plans[key] ?? FALLBACK_BOOST_PLANS[key])[0]?.amount;
                return (
                  <Pressable
                    key={key}
                    onPress={() => handleSelectType(key)}
                    style={[
                      styles.serviceCard,
                      selected && {
                        borderColor: accent.bright,
                        backgroundColor: `${accent.main}14`,
                      },
                    ]}
                  >
                    <View style={[styles.serviceIconWrap, selected && { backgroundColor: `${accent.main}22` }]}>
                      <AppIcon
                        name={meta.icon}
                        size={22}
                        color={selected ? accent.bright : colors.textMuted}
                      />
                    </View>
                    <Text style={[styles.serviceEmoji]}>{meta.emoji}</Text>
                    <Text style={[styles.serviceTitle, selected && { color: accent.bright }]}>
                      {meta.title}
                    </Text>
                    <Text style={styles.serviceDesc} numberOfLines={2}>{meta.desc}</Text>
                    {minPrice != null ? (
                      <Text style={[styles.servicePrice, selected && { color: accent.bright }]}>
                        من {minPrice} ر.س
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>مدة الترقية</Text>
            <View style={[styles.durationRow, rtlRow]}>
              {typePlans.map((plan) => {
                const selected = durationDays === plan.durationDays;
                return (
                  <Pressable
                    key={plan.durationDays}
                    onPress={() => setDurationDays(plan.durationDays)}
                    style={[
                      styles.durationChip,
                      selected && {
                        borderColor: currentAccent.bright,
                        backgroundColor: `${currentAccent.main}14`,
                      },
                    ]}
                  >
                    <Text style={[styles.durationLabel, selected && { color: currentAccent.bright }]}>
                      {plan.labelAr}
                    </Text>
                    <Text style={[styles.durationPrice, selected && { color: currentAccent.bright }]}>
                      {plan.amount} ر.س
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>ملخص الطلب</Text>
              <View style={[styles.summaryRow, rtlRow]}>
                <Text style={styles.summaryKey}>الخدمة</Text>
                <Text style={styles.summaryVal}>{BOOST_TYPE_META[boostType].title}</Text>
              </View>
              <View style={[styles.summaryRow, rtlRow]}>
                <Text style={styles.summaryKey}>المدة</Text>
                <Text style={styles.summaryVal}>{selectedPlan?.labelAr}</Text>
              </View>
              <View style={[styles.summaryRow, rtlRow]}>
                <Text style={styles.summaryKey}>المبلغ</Text>
                <Text style={[styles.summaryVal, styles.summaryAmount]}>
                  {selectedPlan?.amount ?? 0} ر.س
                </Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>طريقة السداد</Text>
            <View style={[styles.methodRow, rtlRow]}>
              {PAYMENT_METHODS.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setMethod(m.id)}
                  style={[
                    styles.methodChip,
                    method === m.id && {
                      borderColor: colors.electric,
                      backgroundColor: `${colors.electric}12`,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>{m.icon}</Text>
                  <Text
                    style={[
                      styles.methodLabel,
                      method === m.id && { color: colors.electricBright },
                    ]}
                  >
                    {m.labelAr}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.payBtn, processing && { opacity: 0.7 }]}
              onPress={handlePay}
              disabled={processing}
            >
              <LinearGradient
                colors={payGradient()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payBtnInner}
              >
                {processing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <AppIcon name={BOOST_TYPE_META[boostType].icon} size={20} color="#fff" />
                    <Text style={styles.payBtnText}>
                      متابعة الدفع · {selectedPlan?.amount ?? 0} ر.س
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <View style={[styles.footerActions, rtlRow]}>
              {onSkip ? (
                <Pressable onPress={onSkip} style={styles.skipBtn} disabled={processing}>
                  <Text style={styles.skipText}>تخطي الآن</Text>
                </Pressable>
              ) : null}
              <View style={[styles.niBadge, rtlRow]}>
                <AppIcon name="lock-closed-outline" size={12} color={colors.textSubtle} />
                <Text style={styles.niText}>دفع آمن · Network International</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.bgOverlay,
    },
    sheet: {
      maxHeight: '92%',
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
    },
    rim: {
      height: 1,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
      alignItems: 'center',
      gap: spacing.md,
    },
    headerTitle: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    headerSub: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.bgGlass,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    publishBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      marginBottom: spacing.sm,
    },
    publishBannerTitle: {
      ...typography.body,
      color: '#fff',
      fontWeight: '800',
    },
    publishBannerSub: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.88)',
      marginTop: 2,
    },
    sectionLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '700',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    serviceGrid: {
      gap: spacing.sm,
    },
    serviceCard: {
      borderWidth: 1.5,
      borderColor: colors.borderSoft,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: colors.bgGlass,
      gap: 4,
    },
    serviceIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgSurface,
      marginBottom: 4,
    },
    serviceEmoji: {
      fontSize: 16,
    },
    serviceTitle: {
      ...typography.body,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    serviceDesc: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 18,
    },
    servicePrice: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '700',
      marginTop: 4,
    },
    durationRow: {
      gap: spacing.sm,
    },
    durationChip: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.borderSoft,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      backgroundColor: colors.bgGlass,
    },
    durationLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '700',
    },
    durationPrice: {
      ...typography.h3,
      color: colors.textPrimary,
      marginTop: 4,
    },
    summaryCard: {
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: colors.bgGlass,
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    summaryTitle: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '800',
      marginBottom: 4,
    },
    summaryRow: {
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryKey: {
      ...typography.caption,
      color: colors.textMuted,
    },
    summaryVal: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    summaryAmount: {
      color: colors.electricBright,
      fontWeight: '800',
    },
    methodRow: {
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    methodChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.bgGlass,
    },
    methodLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSoft,
      gap: spacing.sm,
    },
    payBtn: {
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    payBtnInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.lg,
    },
    payBtnText: {
      ...typography.body,
      color: '#fff',
      fontWeight: '800',
    },
    footerActions: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    skipBtn: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    skipText: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '700',
    },
    niBadge: {
      alignItems: 'center',
      gap: 6,
      flex: 1,
      justifyContent: 'center',
    },
    niText: {
      fontSize: 11,
      color: colors.textSubtle,
    },
  });
}
