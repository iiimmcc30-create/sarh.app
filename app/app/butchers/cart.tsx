// SAFAT — Butcher Cart Screen (سلة الملحمة)
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
import { AppText, SarhBackButton, SarhButton } from '@/design-system/components';
import { BottomAction, Row, Screen, ScreenBody } from '@/design-system/layout';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80';

export default function ButcherCartScreen() {
  const params = useLocalSearchParams<{ butcherId?: string }>();
  const routeButcherId = routeParam(params.butcherId);
  const router = useRouter();
  const { gutter } = useLayout();
  const { gradients } = useTheme();
  const { accessToken } = useAuth();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [loadingSubmit, setLoadingSubmit] = useState(false);

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
          method: 'mada',
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

  return (
    <Screen edges={['top']} pattern={false} style={styles.screen}>
      <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />

      <Row align="center" gap="sm" style={[styles.header, { paddingHorizontal: gutter }]}>
        <SarhBackButton onPress={() => router.back()} color={styles.iconColor.color} style={styles.backBtn} />
        <View style={styles.headerCenter}>
          <AppText variant="cardTitle" align="center">سلة الطلب</AppText>
          {butcherNameAr ? (
            <AppText variant="caption" color="textMuted" align="center" numberOfLines={1}>
              {butcherNameAr}
            </AppText>
          ) : null}
        </View>
        {itemCount > 0 ? (
          <Pressable onPress={() => clearCart()} hitSlop={8}>
            <AppText variant="label" color="danger" align="center" style={styles.clearText}>
              تفريغ
            </AppText>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </Row>

      <ScreenBody
        gutter={false}
        width="full"
        bottomInset={items.length > 0 ? 'action' : 'none'}
      >
        {butcherLogo ? (
          <Row align="center" gap="sm" style={styles.butcherRow}>
            <Image
              source={{ uri: resolveMediaUrl(butcherLogo) ?? PLACEHOLDER }}
              style={styles.butcherLogo}
              contentFit="cover"
            />
            <AppText variant="body">{butcherNameAr}</AppText>
          </Row>
        ) : null}

        {items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <AppIcon name="cart-outline" size={40} color={styles.mutedColor.color} />
            <AppText variant="cardTitle">لا منتجات في السلة</AppText>
            <AppText variant="caption" color="textMuted" align="center">
              أضف منتجات من صفحة الملحمة
            </AppText>
          </View>
        ) : (
          <View style={styles.lines}>
            {items.map((line) => (
              <Row key={line.id} gap="none" style={styles.lineCard}>
                <Image
                  source={{
                    uri: resolveMediaUrl(line.product.images[0]) ?? PLACEHOLDER,
                  }}
                  style={styles.lineImg}
                  contentFit="cover"
                />
                <View style={styles.lineBody}>
                  <AppText variant="body" numberOfLines={1}>
                    {line.product.nameAr}
                  </AppText>
                  <AppText variant="caption" color="textMuted">
                    {cutLabelAr(line.cutType)} ·{' '}
                    {formatWeightLabel(line.product, line.weightKg)}
                  </AppText>
                  <Row align="center" justify="between" style={styles.lineFooter}>
                    <AppText variant="body" color="textSecondary">
                      {line.lineTotal.toLocaleString('en-US')} {currencySymbol}
                    </AppText>
                    <Pressable
                      onPress={() => removeLine(line.id)}
                      hitSlop={8}
                      style={styles.removeBtn}
                    >
                      <AppIcon name="trash-outline" size={18} color={styles.dangerColor.color} />
                    </Pressable>
                  </Row>
                </View>
              </Row>
            ))}
          </View>
        )}

        {items.length > 0 ? (
          <>
            <ButcherDeliverySegment value={deliveryType} onChange={setDeliveryType} />

            {deliveryType === 'delivery' ? (
              <View style={styles.fieldBlock}>
                <DeliveryMapAddressField onAddressChange={setDeliveryAddress} />
              </View>
            ) : null}

            <View style={styles.fieldBlock}>
              <View style={{ width: '100%' }}>
                <AppText variant="body" style={styles.fieldLabel}>ملاحظات (اختياري)</AppText>
              </View>
              <TextInput
                style={[styles.input, rtlInputText]}
                placeholder="تعليمات خاصة للملحمة..."
                placeholderTextColor={styles.mutedColor.color}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            <View style={styles.summary}>
              <Row justify="between" align="center">
                <AppText variant="body" color="textSecondary">المجموع ({itemCount})</AppText>
                <AppText variant="cardTitle">
                  {subtotal.toLocaleString('en-US')} {currencySymbol}
                </AppText>
              </Row>
              <AppText variant="micro" color="textMuted" style={styles.summaryHint}>
                رسوم التوصيل (إن وُجدت) تُحسب لاحقاً عند تفعيل الدفع من السلة.
              </AppText>
            </View>
          </>
        ) : null}
      </ScreenBody>

      {items.length > 0 ? (
        <BottomAction>
          <SarhButton
            title="ادفع الآن"
            leftIcon="card-outline"
            loading={loadingSubmit}
            disabled={loadingSubmit}
            onPress={() => void handlePayNow()}
          />
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
    clearText: {
      minWidth: 44,
    },
    butcherRow: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    butcherLogo: {
      width: 36,
      height: 36,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
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
    lines: { gap: spacing.sm, paddingTop: spacing.sm },
    lineCard: {
      marginHorizontal: spacing.lg,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    lineImg: { width: 88, height: 88 },
    lineBody: {
      flex: 1,
      padding: spacing.md,
      gap: 4,
      justifyContent: 'center',
    },
    lineFooter: {
      marginTop: spacing.xs,
    },
    removeBtn: { padding: 4 },
    fieldBlock: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    fieldLabel: {
      color: colors.textPrimary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: colors.bgSurface,
      color: colors.textPrimary,
      minHeight: 48,
    },
    summary: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      padding: spacing.lg,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      gap: spacing.sm,
    },
    summaryHint: {
      lineHeight: 18,
    },
    iconColor: { color: colors.textPrimary },
    mutedColor: { color: colors.textMuted },
    dangerColor: { color: colors.danger },
  });
}
