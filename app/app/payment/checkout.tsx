/**
 * In-app Network International hosted checkout (WebView).
 * Keeps the shopper inside سرح instead of opening an external browser.
 */
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  completeInAppPaymentCheckout,
  isPaymentReturnUrl,
} from '@/services/paymentCheckout';

function pickParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function PaymentCheckoutScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const router = useRouter();
  const params = useLocalSearchParams<{
    checkoutUrl?: string | string[];
    paymentId?: string | string[];
    context?: string | string[];
    listingId?: string | string[];
    orderId?: string | string[];
    orderNumber?: string | string[];
    butcherId?: string | string[];
    boostType?: string | string[];
    durationDays?: string | string[];
  }>();

  const checkoutUrl = decodeURIComponent(pickParam(params.checkoutUrl));
  const paymentId = pickParam(params.paymentId);
  const context = pickParam(params.context) || 'generic';
  const listingId = pickParam(params.listingId);
  const orderId = pickParam(params.orderId);
  const orderNumber = pickParam(params.orderNumber);
  const butcherId = pickParam(params.butcherId);
  const boostType = pickParam(params.boostType);
  const durationDays = pickParam(params.durationDays);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const settledRef = useRef(false);

  const resultParams = useMemo(
    () => ({
      paymentId,
      context,
      gatewayReturn: '1',
      ...(listingId ? { listingId } : {}),
      ...(orderId ? { orderId } : {}),
      ...(orderNumber ? { orderNumber } : {}),
      ...(butcherId ? { butcherId } : {}),
      ...(boostType ? { boostType } : {}),
      ...(durationDays ? { durationDays } : {}),
    }),
    [
      paymentId,
      context,
      listingId,
      orderId,
      orderNumber,
      butcherId,
      boostType,
      durationDays,
    ],
  );

  const finish = useCallback(
    (outcome: 'success' | 'cancel') => {
      if (settledRef.current) return;
      settledRef.current = true;
      completeInAppPaymentCheckout(outcome);

      if (outcome === 'success') {
        router.replace({
          pathname: '/payment/result',
          params: resultParams,
        } as never);
        return;
      }

      router.replace('/payment/cancel' as never);
    },
    [router, resultParams],
  );

  const handleClose = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    completeInAppPaymentCheckout('cancel');
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/payment/cancel' as never);
    }
  }, [router]);

  const handleNavUrl = useCallback(
    (url: string): boolean => {
      const kind = isPaymentReturnUrl(url);
      if (!kind) return true;
      finish(kind === 'result' ? 'success' : 'cancel');
      return false;
    },
    [finish],
  );

  const onShouldStartLoadWithRequest = useCallback(
    (request: { url?: string }) => {
      if (!request.url) return true;
      return handleNavUrl(request.url);
    },
    [handleNavUrl],
  );

  const onNavigationStateChange = useCallback(
    (nav: WebViewNavigation) => {
      if (nav.url) handleNavUrl(nav.url);
    },
    [handleNavUrl],
  );

  if (!checkoutUrl) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <Text style={styles.errorTitle}>تعذّر فتح صفحة الدفع</Text>
        <Pressable style={styles.closeBtn} onPress={handleClose}>
          <Text style={styles.closeBtnText}>إغلاق</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleClose}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="إغلاق الدفع"
        >
          <AppIcon name="close" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>إتمام الدفع</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.webWrap}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.electricBright} />
            <Text style={styles.loadingText}>جارٍ تحميل بوابة الدفع...</Text>
          </View>
        ) : null}

        {loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>{loadError}</Text>
            <Pressable style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeBtnText}>إغلاق</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            source={{ uri: checkoutUrl }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setLoadError('تعذّر تحميل صفحة الدفع. حاول مرة أخرى.');
            }}
            onHttpError={(e) => {
              if (e.nativeEvent.statusCode >= 400) {
                setLoading(false);
                setLoadError('تعذّر تحميل صفحة الدفع. حاول مرة أخرى.');
              }
            }}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onNavigationStateChange={onNavigationStateChange}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            setSupportMultipleWindows={false}
            originWhitelist={['https://*', 'http://*', 'safat://*']}
            // iOS: allow NI paypage + 3DS redirects inside the same WebView.
            allowsInlineMediaPlayback
            {...(Platform.OS === 'android'
              ? { mixedContentMode: 'always' as const }
              : {})}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bgDeep,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    headerBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    webWrap: {
      flex: 1,
      position: 'relative',
    },
    webview: {
      flex: 1,
      backgroundColor: '#fff',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 2,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      backgroundColor: colors.bgDeep,
    },
    loadingText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    errorBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
    },
    errorTitle: {
      ...typography.body,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    closeBtn: {
      backgroundColor: colors.electricBright,
      borderRadius: radius.xl,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      minWidth: 160,
      alignItems: 'center',
    },
    closeBtnText: {
      ...typography.bodyStrong,
      color: '#fff',
    },
  });
}
