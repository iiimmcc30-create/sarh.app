// SAFAT — Butcher Cart Screen (سلة الملحمة) — Two-phase checkout
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { ButcherDeliverySegment } from '@/components/butcher/ButcherDeliverySegment';
import { DeliveryMapAddressField } from '@/components/butchers/DeliveryMapAddressField';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { butcherMarket } from '@/constants/butcherMarket';
import { butcherTypography } from '@/constants/butcherTypography';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useLayout } from '@/hooks/useLayout';
import { formatWeightLabel } from '@/lib/butcherOrderPricing';
import { rtlInputText } from '@/lib/rtl';
import { useButcherCart } from '@/contexts/ButcherCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import {
  cutLabelAr,
  gccCurrencies,
  routeParam,
  type Country,
} from '@/services/butcherData';
import { launchPaymentCheckout } from '@/services/payments';
import { resolveMediaUrl } from '@/services/media';
import { PAYMENT_METHODS, type NIPaymentMethod } from '@/services/network_international';
import { AppText, SarhBackButton } from '@/design-system/components';
import { BottomAction, Row, Screen, ScreenBody } from '@/design-system/layout';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80';

type CheckoutPhase = 'confirm' | 'payment';

// ─── Progress Indicator ───────────────────────────────────────────────────────
function CheckoutProgress({ phase }: { phase: CheckoutPhase }) {
  const styles = useThemedStyles(({ colors }) => createProgressStyles(colors));
  const confirmDone = phase === 'payment';
  const paymentActive = phase === 'payment';

  return (
    <Row align="center" justify="center" gap="sm" style={styles.row}>
      <View style={styles.step}>
        <View style={[styles.dot, confirmDone ? styles.dotDone : styles.dotActive]}>
          {confirmDone ? (
            <AppIcon name="checkmark" size={11} color="#fff" />
          ) : (
            <View style={styles.dotInner} />
          )}
        </View>
        <AppText
          variant="caption"
          style={[styles.stepLabel, !confirmDone ? styles.labelActive : styles.labelDone]}
        >
          تأكيد الطلب
        </AppText>
      </View>

      <View style={styles.line} />

      <View style={styles.step}>
        <View style={[styles.dot, paymentActive ? styles.dotActive : styles.dotIdle]}>
          {paymentActive ? <View style={styles.dotInner} /> : null}
        </View>
        <AppText
          variant="caption"
          style={[styles.stepLabel, paymentActive ? styles.labelActive : styles.labelIdle]}
        >
          الدفع
        </AppText>
      </View>
    </Row>
  );
}

function createProgressStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    step: {
      alignItems: 'center',
      gap: 4,
    },
    dot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotActive: { backgroundColor: butcherMarket.seeAll },
    dotDone: { backgroundColor: butcherMarket.seeAll },
    dotIdle: {
      backgroundColor: colors.bgElevated,
      borderWidth: 1.5,
      borderColor: colors.borderSoft,
    },
    dotInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#fff',
    },
    line: {
      flex: 1,
      height: 1.5,
      backgroundColor: colors.borderSoft,
      marginTop: -14,
    },
    stepLabel: { ...butcherTypography.meta },
    labelActive: { color: butcherMarket.seeAll, fontWeight: '600' },
    labelDone: { color: butcherMarket.seeAll },
    labelIdle: { color: colors.textMuted },
  });
}

// ─── Payment Method Row ───────────────────────────────────────────────────────
function PaymentMethodRow({
  item,
  selected,
  onSelect,
}: {
  item: (typeof PAYMENT_METHODS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const styles = useThemedStyles(({ colors }) => createPayMethodStyles(colors));
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && { opacity: 0.85 }]}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={item.arabic}
    >
      <Row align="center" gap="md" style={styles.inner}>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioInner} /> : null}
        </View>
        <AppText variant="body" style={[styles.methodLabel, selected && styles.methodLabelSelected]}>
          {item.arabic}
        </AppText>
        <View style={styles.iconWrap}>
          <AppText variant="body">{item.icon}</AppText>
        </View>
      </Row>
    </Pressable>
  );
}

function createPayMethodStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.borderSoft,
      backgroundColor: colors.bgSurface,
      overflow: 'hidden',
    },
    rowSelected: {
      borderColor: butcherMarket.seeAll,
      backgroundColor: butcherMarket.seeAll + '0D',
    },
    inner: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    radioSelected: { borderColor: butcherMarket.seeAll },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: butcherMarket.seeAll,
    },
    methodLabel: { flex: 1, color: colors.textPrimary },
    methodLabelSelected: { color: butcherMarket.seeAll, fontWeight: '600' },
    iconWrap: {},
  });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ButcherCartScreen() {
  const params = useLocalSearchParams<{ butcherId?: string }>();
  const routeButcherId = routeParam(params.butcherId);
  const router = useRouter();
  const { gutter } = useLayout();
  const { gradients } = useTheme();
  const { accessToken } = useAuth();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [phase, setPhase] = useState<CheckoutPhase>('confirm');
  const [selectedMethod, setSelectedMethod] = useState<NIPaymentMethod>('mada');

  const {
    butcherId,
    butcherNameAr,
    butcherLogo,
    items,
    itemCount,
    subtotal,
    deliveryType,
    deliveryAddress,
    notes,
    setDeliveryType,
    setDeliveryAddress,
    setNotes,
    removeLine,
    clearCart,
  } = useButcherCart();

  const countryCode = (items[0]?.product.country as Country) || 'SA';
  const currency = gccCurrencies[countryCode] || gccCurrencies['SA'];
  const currencySymbol = currency.symbol;

  const wrongButcher =
    routeButcherId && butcherId && routeButcherId !== butcherId;

  const goSuccess = (orderId: string, orderNumber: string, paymentStatus: string) => {
    clearCart();
    router.replace({
      pathname: '/butchers/order-success',
      params: { orderId, orderNumber, paymentStatus, butcherId: butcherId ?? '' },
    });
  };

  const handlePayNow = async () => {
    if (!butcherId || items.length === 0) return;
    if (!accessToken) {
      Alert.alert('تسجيل الدخول', 'يجب تسجيل الدخول لإتمام الطلب والدفع');
      router.push('/auth/phone');
      return;
    }
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert('العنوان مطلوب', 'حدّد موقع التوصيل على الخريطة قبل إتمام الدفع');
      return;
    }
    if (subtotal <= 0 || !Number.isFinite(subtotal)) {
      Alert.alert('خطأ', 'مبلغ الطلب غير صالح');
      return;
    }

    setLoadingSubmit(true);
    try {
      const payload = {
        butcherId,
        items: items.map((line) => ({
          productId: line.productId,
          cutType: line.cutType,
          weightKg: line.weightKg,
        })),
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress.trim() : null,
        notes: notes.trim() || null,
        currency: currency.code,
      };

      const res = await fetch(`${API_BASE}/api/butchers/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        Alert.alert('خطأ', json.messageAr || json.message || 'حدث خطأ أثناء إنشاء الطلب');
        return;
      }

      const orderId = json.data?.id as string;
      const orderNumber = json.data?.orderNumber as string;
      const amount = Number(json.data?.totalPrice ?? subtotal);

      const payRes = await fetch(`${API_BASE}/api/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount,
          currency: currency.code || 'SAR',
          method: selectedMethod,
          type: 'butcher_order',
          referenceId: orderId,
          description: `Butcher order ${orderNumber}`,
          descriptionAr: `دفع طلب ملحمة رقم ${orderNumber}`,
        }),
      });

      const payJson = await payRes.json().catch(() => ({}));

      if (!payRes.ok || !payJson.success || !payJson.data) {
        const errMsg = payJson.messageAr || payJson.message || 'فشل إنشاء معاملة الدفع';
        Alert.alert(
          'الطلب بانتظار الدفع',
          `${errMsg}\nيمكنك إكمال الدفع لاحقاً من صفحة الطلب.`,
          [{ text: 'متابعة', onPress: () => goSuccess(orderId, orderNumber, 'unpaid') }],
        );
        return;
      }

      const { checkoutUrl, paymentId, devMode } = payJson.data as {
        checkoutUrl?: string;
        paymentId?: string;
        devMode?: boolean;
      };

      const payOutcome = await launchPaymentCheckout({
        accessToken,
        paymentId,
        checkoutUrl,
        devMode,
        context: 'butcher_order',
        returnParams: {
          orderId,
          orderNumber,
          butcherId,
        },
      });

      if (payOutcome === 'cancelled' || payOutcome === 'failed') {
        Alert.alert(
          'الطلب بانتظار الدفع',
          'يمكنك إكمال الدفع لاحقاً من صفحة الطلب.',
          [{ text: 'متابعة', onPress: () => goSuccess(orderId, orderNumber, 'unpaid') }],
        );
      }
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', 'تعذر الاتصال بالخادم. يرجى التحقق من الشبكة.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ─── Empty / wrong butcher ──────────────────────────────────────────────────
  if (wrongButcher || (!butcherId && itemCount === 0)) {
    return (
      <Screen edges={['top']} pattern={false} style={styles.screen}>
        <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />
        <ScreenBody scroll={false} gutter={false} width="full">
          <View style={styles.emptyWrap}>
            <AppIcon name="cart-outline" size={48} color={styles.mutedColor.color} />
            <AppText variant="cardTitle">السلة فارغة</AppText>
            <Pressable onPress={() => router.back()} style={styles.backLink}>
              <AppText variant="body" color="textSecondary">العودة للملحمة</AppText>
            </Pressable>
          </View>
        </ScreenBody>
      </Screen>
    );
  }

  const phaseTitle = phase === 'confirm' ? 'تأكيد الطلب' : 'الدفع';

  // ─── Phase 1: Order Confirmation ────────────────────────────────────────────
  const renderConfirmPhase = () => (
    <>
      {/* Items */}
      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <AppIcon name="cart-outline" size={40} color={styles.mutedColor.color} />
          <AppText variant="cardTitle">لا منتجات في السلة</AppText>
          <AppText variant="caption" color="textMuted" align="center">
            أضف منتجات من صفحة الملحمة
          </AppText>
        </View>
      ) : (
        <View style={styles.section}>
          <AppText variant="label" style={styles.sectionLabel}>المنتجات</AppText>
          <View style={styles.itemsCard}>
            {items.map((line, idx) => (
              <View
                key={line.id}
                style={[styles.lineRow, idx > 0 && styles.lineRowBorder]}
              >
                <Row align="center" gap="sm" style={styles.lineInner}>
                  <Image
                    source={{ uri: resolveMediaUrl(line.product.images[0]) ?? PLACEHOLDER }}
                    style={styles.lineImg}
                    contentFit="cover"
                  />
                  <View style={styles.lineBody}>
                    <AppText variant="body" numberOfLines={1} style={styles.lineTitle}>
                      {line.product.nameAr}
                    </AppText>
                    <AppText variant="caption" color="textMuted">
                      {cutLabelAr(line.cutType)} · {formatWeightLabel(line.product, line.weightKg)}
                    </AppText>
                    <Row align="center" justify="between" style={styles.lineFooter}>
                      <AppText variant="label" style={styles.linePrice}>
                        {line.lineTotal.toLocaleString('en-US')} {currencySymbol}
                      </AppText>
                      <Pressable
                        onPress={() => removeLine(line.id)}
                        hitSlop={8}
                        style={styles.removeBtn}
                        accessibilityLabel="إزالة المنتج"
                      >
                        <AppIcon name="trash-outline" size={16} color={styles.dangerColor.color} />
                      </Pressable>
                    </Row>
                  </View>
                </Row>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Delivery & notes only when items exist */}
      {items.length > 0 ? (
        <>
          <View style={styles.section}>
            <AppText variant="label" style={styles.sectionLabel}>طريقة الاستلام</AppText>
            <ButcherDeliverySegment value={deliveryType} onChange={setDeliveryType} />
          </View>

          {deliveryType === 'delivery' ? (
            <View style={styles.section}>
              <AppText variant="label" style={styles.sectionLabel}>عنوان التوصيل</AppText>
              <DeliveryMapAddressField onAddressChange={setDeliveryAddress} />
            </View>
          ) : null}

          <View style={styles.section}>
            <AppText variant="label" style={styles.sectionLabel}>ملاحظة للملحمة (اختياري)</AppText>
            <TextInput
              style={[styles.input, rtlInputText]}
              placeholder="أضف أي ملاحظة للملحمة..."
              placeholderTextColor={styles.mutedColor.color}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Cost summary */}
          <View style={styles.summaryCard}>
            <Row align="center" justify="between" style={styles.summaryRow}>
              <AppText variant="caption" color="textMuted">قيمة المنتجات</AppText>
              <AppText variant="body">{subtotal.toLocaleString('en-US')} {currencySymbol}</AppText>
            </Row>
            <Row align="center" justify="between" style={styles.summaryRow}>
              <AppText variant="caption" color="textMuted">التوصيل</AppText>
              <AppText variant="caption" color="textMuted">
                {deliveryType === 'pickup' ? 'استلام من الملحمة' : 'يُحدد لاحقاً'}
              </AppText>
            </Row>
            <View style={styles.summaryDivider} />
            <Row align="center" justify="between" style={styles.summaryRow}>
              <AppText variant="body">الإجمالي</AppText>
              <AppText variant="cardTitle" style={styles.totalPrice}>
                {subtotal.toLocaleString('en-US')} {currencySymbol}
              </AppText>
            </Row>
          </View>
        </>
      ) : null}
    </>
  );

  // ─── Phase 2: Payment ────────────────────────────────────────────────────────
  const renderPaymentPhase = () => (
    <>
      {/* Brief summary */}
      <View style={styles.summaryCard}>
        {butcherLogo ? (
          <Row align="center" gap="sm" style={styles.summaryRow}>
            <Image
              source={{ uri: resolveMediaUrl(butcherLogo) ?? PLACEHOLDER }}
              style={styles.butcherLogo}
              contentFit="cover"
            />
            <View style={styles.butcherSummaryText}>
              <AppText variant="body">{butcherNameAr}</AppText>
              <AppText variant="caption" color="textMuted">
                {itemCount} {itemCount === 1 ? 'منتج' : 'منتجات'}
              </AppText>
            </View>
          </Row>
        ) : null}
        <View style={styles.summaryDivider} />
        <Row align="center" justify="between" style={styles.summaryRow}>
          <AppText variant="body">الإجمالي النهائي</AppText>
          <AppText variant="cardTitle" style={styles.totalPrice}>
            {subtotal.toLocaleString('en-US')} {currencySymbol}
          </AppText>
        </Row>
      </View>

      {/* Payment method */}
      <View style={styles.section}>
        <AppText variant="label" style={styles.sectionLabel}>طريقة الدفع</AppText>
        <View style={styles.methodList}>
          {PAYMENT_METHODS.map((m) => (
            <PaymentMethodRow
              key={m.id}
              item={m}
              selected={selectedMethod === m.id}
              onSelect={() => setSelectedMethod(m.id)}
            />
          ))}
        </View>
      </View>
    </>
  );

  return (
    <Screen edges={['top']} pattern={false} style={styles.screen}>
      <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <Row align="center" gap="sm" style={[styles.header, { paddingHorizontal: gutter }]}>
        <SarhBackButton
          onPress={() => {
            if (phase === 'payment') {
              setPhase('confirm');
            } else {
              router.back();
            }
          }}
          color={styles.iconColor.color}
          style={styles.backBtn}
        />
        <View style={styles.headerCenter}>
          <AppText variant="cardTitle" align="center">{phaseTitle}</AppText>
          {phase === 'confirm' && butcherNameAr ? (
            <AppText variant="caption" color="textMuted" align="center" numberOfLines={1}>
              {butcherNameAr}
            </AppText>
          ) : null}
        </View>
        {phase === 'confirm' && itemCount > 0 ? (
          <Pressable onPress={() => clearCart()} hitSlop={8}>
            <AppText variant="label" color="danger" align="center" style={styles.clearText}>
              تفريغ
            </AppText>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </Row>

      {/* Progress */}
      <CheckoutProgress phase={phase} />

      <ScreenBody
        gutter={false}
        width="full"
        bottomInset={items.length > 0 ? 'action' : 'none'}
      >
        {phase === 'confirm' ? renderConfirmPhase() : renderPaymentPhase()}
      </ScreenBody>

      {/* Sticky CTA */}
      {items.length > 0 ? (
        <BottomAction>
          {phase === 'confirm' ? (
            <Pressable
              style={({ pressed }) => [styles.meatBtn, pressed && { opacity: 0.88 }]}
              onPress={() => {
                if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
                  Alert.alert('العنوان مطلوب', 'حدّد موقع التوصيل على الخريطة أولاً');
                  return;
                }
                setPhase('payment');
              }}
              accessibilityRole="button"
              accessibilityLabel="متابعة للدفع"
            >
              <AppText variant="body" style={styles.meatBtnText}>متابعة للدفع</AppText>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.meatBtn,
                loadingSubmit ? styles.meatBtnDisabled : null,
                pressed && !loadingSubmit ? { opacity: 0.88 } : null,
              ]}
              disabled={loadingSubmit}
              onPress={loadingSubmit ? undefined : () => void handlePayNow()}
              accessibilityRole="button"
              accessibilityLabel="إتمام الدفع"
            >
              {loadingSubmit ? (
                <AppIcon name="refresh-outline" size={18} color="#fff" />
              ) : null}
              <AppText variant="body" style={styles.meatBtnText}>إتمام الدفع</AppText>
            </Pressable>
          )}
        </BottomAction>
      ) : null}
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    header: {
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    clearText: { minWidth: 44 },

    emptyWrap: {
      alignItems: 'center',
      paddingTop: 80,
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    backLink: {
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },

    // Sections
    section: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    sectionLabel: { color: colors.textSecondary },

    // Items card
    itemsCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
    },
    lineRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    lineRowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderHairline,
    },
    lineInner: {},
    lineImg: {
      width: 72,
      height: 72,
      borderRadius: radius.md,
      flexShrink: 0,
    },
    lineBody: { flex: 1, gap: 3 },
    lineTitle: { color: colors.textPrimary },
    lineFooter: { marginTop: 4 },
    linePrice: { color: butcherMarket.seeAll },
    removeBtn: { padding: 4 },

    // Notes input
    input: {
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: colors.bgField,
      color: colors.textPrimary,
      minHeight: 52,
      ...butcherTypography.body,
    },

    // Summary card
    summaryCard: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      padding: spacing.lg,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      gap: spacing.sm,
    },
    summaryRow: {},
    summaryDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderHairline,
      marginVertical: spacing.xs,
    },
    totalPrice: { color: butcherMarket.seeAll },

    // Butcher summary (phase 2)
    butcherLogo: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      flexShrink: 0,
    },
    butcherSummaryText: { flex: 1, gap: 2 },

    // Payment methods
    methodList: { gap: spacing.sm },

    // Meat CTA button
    meatBtn: {
      backgroundColor: butcherMarket.seeAll,
      borderRadius: radius.pill,
      minHeight: 52,
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    meatBtnDisabled: { opacity: 0.55 },
    meatBtnText: {
      ...butcherTypography.emphasis,
      color: '#fff',
    },

    iconColor: { color: colors.textPrimary },
    mutedColor: { color: colors.textMuted },
    dangerColor: { color: colors.danger },
  });
}
