// SAFAT — Butcher Cart Screen (سلة الملحمة)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { ButcherDeliverySegment } from '@/components/butcher/ButcherDeliverySegment';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { formatWeightLabel } from '@/lib/butcherOrderPricing';
import { getRtlRow, rtlBackIcon } from '@/lib/rtl';
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

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80';

export default function ButcherCartScreen() {
  const params = useLocalSearchParams<{ butcherId?: string }>();
  const routeButcherId = routeParam(params.butcherId);
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      Alert.alert('العنوان مطلوب', 'أدخل عنوان التوصيل قبل إتمام الدفع');
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
      <SafeAreaView style={styles.screen} edges={['top']}>
        <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />
        <View style={styles.emptyWrap}>
          <AppIcon name="cart-outline" size={48} color={styles.mutedColor.color} />
          <Text style={styles.emptyTitle}>السلة فارغة</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>العودة للملحمة</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <AppIcon name={rtlBackIcon()} size={22} color={styles.iconColor.color} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>سلة الطلب</Text>
          {butcherNameAr ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              {butcherNameAr}
            </Text>
          ) : null}
        </View>
        {itemCount > 0 ? (
          <Pressable onPress={() => clearCart()} hitSlop={8}>
            <Text style={styles.clearText}>تفريغ</Text>
          </Pressable>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {butcherLogo ? (
          <View style={styles.butcherRow}>
            <Image
              source={{ uri: resolveMediaUrl(butcherLogo) ?? PLACEHOLDER }}
              style={styles.butcherLogo}
              contentFit="cover"
            />
            <Text style={styles.butcherName}>{butcherNameAr}</Text>
          </View>
        ) : null}

        {items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <AppIcon name="cart-outline" size={40} color={styles.mutedColor.color} />
            <Text style={styles.emptyTitle}>لا منتجات في السلة</Text>
            <Text style={styles.emptyHint}>أضف منتجات من صفحة الملحمة</Text>
          </View>
        ) : (
          <View style={styles.lines}>
            {items.map((line) => (
              <View key={line.id} style={styles.lineCard}>
                <Image
                  source={{
                    uri: resolveMediaUrl(line.product.images[0]) ?? PLACEHOLDER,
                  }}
                  style={styles.lineImg}
                  contentFit="cover"
                />
                <View style={styles.lineBody}>
                  <Text style={styles.lineName} numberOfLines={1}>
                    {line.product.nameAr}
                  </Text>
                  <Text style={styles.lineMeta}>
                    {cutLabelAr(line.cutType)} ·{' '}
                    {formatWeightLabel(line.product, line.weightKg)}
                  </Text>
                  <View style={styles.lineFooter}>
                    <Text style={styles.linePrice}>
                      {line.lineTotal.toLocaleString('en-US')} {currencySymbol}
                    </Text>
                    <Pressable
                      onPress={() => removeLine(line.id)}
                      hitSlop={8}
                      style={styles.removeBtn}
                    >
                      <AppIcon name="trash-outline" size={18} color={styles.dangerColor.color} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {items.length > 0 ? (
          <>
            <ButcherDeliverySegment value={deliveryType} onChange={setDeliveryType} />

            {deliveryType === 'delivery' ? (
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>عنوان التوصيل</Text>
                <TextInput
                  style={styles.input}
                  placeholder="الحي، الشارع، رقم المبنى..."
                  placeholderTextColor={styles.mutedColor.color}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  multiline
                />
              </View>
            ) : null}

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>ملاحظات (اختياري)</Text>
              <TextInput
                style={styles.input}
                placeholder="تعليمات خاصة للملحمة..."
                placeholderTextColor={styles.mutedColor.color}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>المجموع ({itemCount})</Text>
                <Text style={styles.summaryValue}>
                  {subtotal.toLocaleString('en-US')} {currencySymbol}
                </Text>
              </View>
              <Text style={styles.summaryHint}>
                رسوم التوصيل (إن وُجدت) تُحسب لاحقاً عند تفعيل الدفع من السلة.
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      {items.length > 0 ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Pressable
            onPress={() => void handlePayNow()}
            disabled={loadingSubmit}
            style={({ pressed }) => [
              styles.payBtn,
              loadingSubmit && styles.payBtnDisabled,
              pressed && !loadingSubmit && { opacity: 0.92 },
            ]}
          >
            {loadingSubmit ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <AppIcon name="card-outline" size={18} color="#fff" />
                <Text style={styles.payBtnText}>ادفع الآن</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    header: {
      ...getRtlRow(),
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.sm,
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
    headerTitle: {
      ...typography.h3,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textPrimary,
    },
    headerSub: {
      ...typography.caption,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textMuted,
      marginTop: 2,
    },
    clearText: {
      ...typography.caption,
      writingDirection: 'rtl', textAlign: 'right', color: colors.danger,
      fontWeight: '600',
      minWidth: 44,
      textAlign: 'center',
    },
    butcherRow: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: spacing.sm,
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
    butcherName: {
      ...typography.bodyStrong,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textPrimary,
    },
    emptyWrap: {
      alignItems: 'center',
      paddingTop: 80,
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    emptyTitle: {
      ...typography.h3,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textPrimary,
    },
    emptyHint: {
      ...typography.caption,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textMuted,
      textAlign: 'center',
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
    backLinkText: {
      ...typography.bodyStrong,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textSecondary,
    },
    lines: { gap: spacing.sm, paddingTop: spacing.sm },
    lineCard: {
      ...getRtlRow(),
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
    lineName: {
      ...typography.bodyStrong,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textPrimary,
    },
    lineMeta: {
      ...typography.caption,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textMuted,
    },
    lineFooter: {
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    linePrice: {
      ...typography.bodyStrong,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textSecondary,
    },
    removeBtn: { padding: 4 },
    fieldBlock: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    fieldLabel: {
      ...typography.bodyStrong,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radius.lg,
      padding: spacing.md,
      backgroundColor: colors.bgSurface,
      color: colors.textPrimary,
      writingDirection: 'rtl', textAlign: 'right', minHeight: 48,
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
    summaryRow: {
      ...getRtlRow(),
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    summaryLabel: {
      ...typography.bodyStrong,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textSecondary,
    },
    summaryValue: {
      ...typography.h3,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textPrimary,
    },
    summaryHint: {
      ...typography.micro,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textMuted,
      lineHeight: 18,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      backgroundColor: colors.bgDeep + 'F2',
      borderTopWidth: 1,
      borderTopColor: colors.borderSoft,
      gap: spacing.xs,
    },
    payBtn: {
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.electric,
      borderRadius: radius.pill,
      paddingVertical: 14,
    },
    payBtnDisabled: { opacity: 0.7 },
    payBtnText: {
      ...typography.bodyStrong,
      writingDirection: 'rtl', textAlign: 'right', color: '#fff',
    },
    iconColor: { color: colors.textPrimary },
    mutedColor: { color: colors.textMuted },
    dangerColor: { color: colors.danger },
  });
}
