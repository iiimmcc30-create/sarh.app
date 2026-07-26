// Payment result screen — polls N-Genius via backend after NI redirect.
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { syncPaymentStatus } from '@/services/payments';
import type { PaymentContext } from '@/services/payments';

type SyncState = 'syncing' | 'paid' | 'pending' | 'failed';

type ContextCopy = {
  successTitle: string;
  successSubtitle: string;
  pendingSubtitle: string;
  primaryLabel: string;
  secondaryLabel?: string;
};

const CONTEXT_COPY: Record<PaymentContext, ContextCopy> = {
  subscription: {
    successTitle: 'تم تفعيل الاشتراك!',
    successSubtitle: 'تم تأكيد الدفع من N-Genius واشتراكك أصبح نشطاً.',
    pendingSubtitle:
      'العملية قيد المعالجة في N-Genius. سيُفعَّل اشتراكك تلقائياً عند التأكيد، أو اضغط «إعادة التحقق».',
    primaryLabel: 'الملف الشخصي',
    secondaryLabel: 'عرض الباقات',
  },
  listing_fee: {
    successTitle: 'تم الدفع بنجاح',
    successSubtitle: 'تم تأكيد عملية الدفع من N-Genius.',
    pendingSubtitle: 'العملية قيد المعالجة. سيُحدَّث الطلب عند تأكيد N-Genius.',
    primaryLabel: 'الاشتراك',
  },
  commission: {
    successTitle: 'تم الدفع بنجاح',
    successSubtitle: 'تم تأكيد عملية الدفع من N-Genius.',
    pendingSubtitle: 'العملية قيد المعالجة. سيظهر في السجل عند التأكيد.',
    primaryLabel: 'الاشتراك',
  },
  boost: {
    successTitle: 'تم تفعيل الترقية!',
    successSubtitle: 'تم تأكيد الدفع من N-Genius.',
    pendingSubtitle: 'العملية قيد المعالجة. ستُفعَّل الترقية عند تأكيد N-Genius.',
    primaryLabel: 'عرض الإعلان',
  },
  butcher_order: {
    successTitle: 'تم الدفع وإرسال الطلب!',
    successSubtitle: 'تم تأكيد الدفع من N-Genius ووصل طلبك للملحمة.',
    pendingSubtitle: 'العملية قيد المعالجة. سيصل طلبك عند تأكيد N-Genius.',
    primaryLabel: 'تفاصيل الطلب',
    secondaryLabel: 'قسم الملاحم',
  },
  generic: {
    successTitle: 'تم الدفع بنجاح!',
    successSubtitle: 'تم تأكيد عملية الدفع من N-Genius.',
    pendingSubtitle: 'العملية قيد المعالجة. انتظر قليلاً أو أعد التحقق.',
    primaryLabel: 'الملف الشخصي',
    secondaryLabel: 'عرض الباقات',
  },
};

const POLL_INTERVAL_MS = 3500;
const MAX_POLL_ATTEMPTS = 6;

function normalizeContext(raw?: string): PaymentContext {
  const allowed: PaymentContext[] = [
    'subscription',
    'listing_fee',
    'commission',
    'boost',
    'butcher_order',
    'generic',
  ];
  if (raw && allowed.includes(raw as PaymentContext)) {
    return raw as PaymentContext;
  }
  return 'generic';
}

export default function PaymentResultScreen() {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const router = useRouter();
  const params = useLocalSearchParams<{
    paymentId?: string;
    context?: string;
    listingId?: string;
    orderId?: string;
    orderNumber?: string;
    butcherId?: string;
  }>();
  const { paymentId, context: rawContext, listingId, orderId, orderNumber, butcherId } = params;
  const context = normalizeContext(rawContext);
  const copy = CONTEXT_COPY[context];
  const { refetchSubscription } = useSubscription();
  const { accessToken } = useAuth();
  const [syncState, setSyncState] = useState<SyncState>('syncing');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const pollCountRef = useRef(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runSync = useCallback(async (): Promise<SyncState> => {
    if (!paymentId || !accessToken) {
      return 'pending';
    }

    const result = await syncPaymentStatus(accessToken, paymentId);
    if (result.messageAr) {
      setStatusMessage(result.messageAr);
    }
    if (result.status === 'paid') {
      await refetchSubscription();
      return 'paid';
    }
    if (result.status === 'failed') {
      return 'failed';
    }
    return 'pending';
  }, [paymentId, accessToken, refetchSubscription]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollCountRef.current = 0;
    pollingRef.current = setInterval(() => {
      pollCountRef.current += 1;
      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling();
        return;
      }
      void runSync().then((state) => {
        if (state === 'paid' || state === 'failed') {
          setSyncState(state);
          stopPolling();
        }
      });
    }, POLL_INTERVAL_MS);
  }, [runSync, stopPolling]);

  useEffect(() => {
    void (async () => {
      setSyncState('syncing');
      const state = await runSync();
      setSyncState(state);
      if (state === 'pending') {
        startPolling();
      }
    })();

    return () => stopPolling();
  }, [runSync, startPolling, stopPolling]);

  const retrySync = useCallback(() => {
    setSyncState('syncing');
    void (async () => {
      const state = await runSync();
      setSyncState(state);
      if (state === 'pending') {
        startPolling();
      } else {
        stopPolling();
      }
    })();
  }, [runSync, startPolling, stopPolling]);

  const goPrimary = useCallback(() => {
    switch (context) {
      case 'subscription':
        router.replace('/(tabs)/profile' as never);
        break;
      case 'listing_fee':
      case 'commission':
        router.replace('/subscription' as never);
        break;
      case 'boost':
        if (listingId) {
          router.replace({ pathname: '/listing/[id]', params: { id: listingId } } as never);
        } else {
          router.replace('/(tabs)/' as never);
        }
        break;
      case 'butcher_order':
        router.replace({
          pathname: '/butchers/order-success',
          params: {
            orderId: orderId ?? '',
            orderNumber: orderNumber ?? '',
            butcherId: butcherId ?? '',
            paymentStatus: syncState === 'paid' ? 'paid' : 'unpaid',
          },
        } as never);
        break;
      default:
        router.replace('/(tabs)/profile' as never);
    }
  }, [context, listingId, orderId, orderNumber, butcherId, router, syncState]);

  const goSecondary = useCallback(() => {
    if (context === 'subscription') {
      router.replace('/subscription' as never);
      return;
    }
    if (context === 'butcher_order') {
      router.replace('/butchers' as never);
      return;
    }
    router.replace('/subscription' as never);
  }, [context, router]);

  if (syncState === 'syncing') {
    return (
      <View style={styles.screen}>
        <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
          <ActivityIndicator size="large" color={colors.electricBright} />
          <Text style={styles.title}>جارٍ التحقق من N-Genius...</Text>
          <Text style={styles.subtitle}>
            لا يُفعَّل الاشتراك قبل تأكيد بوابة الدفع
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  if (syncState === 'paid') {
    return (
      <View style={styles.screen}>
        <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
          <View style={[styles.iconWrap, { backgroundColor: `${colors.emerald}22` }]}>
            <AppIcon name="checkmark-circle" size={52} color={colors.emerald} />
          </View>
          <Text style={styles.title}>{copy.successTitle}</Text>
          <Text style={styles.subtitle}>{copy.successSubtitle}</Text>
          <Pressable style={styles.primaryBtn} onPress={goPrimary}>
            <Text style={styles.primaryBtnText}>{copy.primaryLabel}</Text>
          </Pressable>
          {copy.secondaryLabel ? (
            <Pressable style={styles.secondaryBtn} onPress={goSecondary}>
              <Text style={styles.secondaryBtnText}>{copy.secondaryLabel}</Text>
            </Pressable>
          ) : null}
        </SafeAreaView>
      </View>
    );
  }

  if (syncState === 'failed') {
    return (
      <View style={styles.screen}>
        <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
          <View style={[styles.iconWrap, { backgroundColor: `${colors.rose}22` }]}>
            <AppIcon name="close-circle" size={52} color={colors.rose} />
          </View>
          <Text style={styles.title}>فشلت عملية الدفع</Text>
          <Text style={styles.subtitle}>
            لم يُؤكَّد الدفع من N-Genius. يمكنك المحاولة مجدداً.
          </Text>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.rose }]}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryBtnText}>حاول مجدداً</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={goPrimary}>
            <Text style={styles.secondaryBtnText}>{copy.primaryLabel}</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.wrap} edges={['top', 'bottom']}>
        <View style={[styles.iconWrap, { backgroundColor: `${colors.amber}22` }]}>
          <AppIcon name="time-outline" size={52} color={colors.amber} />
        </View>
        <Text style={styles.title}>العملية قيد المعالجة</Text>
        <Text style={styles.subtitle}>
          {statusMessage ?? copy.pendingSubtitle}
        </Text>
        <Pressable style={styles.primaryBtn} onPress={retrySync}>
          <Text style={styles.primaryBtnText}>إعادة التحقق</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={goPrimary}>
          <Text style={styles.secondaryBtnText}>{copy.primaryLabel}</Text>
        </Pressable>
        {copy.secondaryLabel ? (
          <Pressable style={styles.secondaryBtn} onPress={goSecondary}>
            <Text style={styles.secondaryBtnText}>{copy.secondaryLabel}</Text>
          </Pressable>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1 },
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.lg,
    },
    iconWrap: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: spacing.md,
    },
    primaryBtn: {
      backgroundColor: colors.electricBright,
      borderRadius: radius.xl,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      minWidth: 220,
      alignItems: 'center',
    },
    primaryBtnText: { ...typography.bodyStrong, color: '#fff' },
    secondaryBtn: { paddingVertical: spacing.sm },
    secondaryBtnText: { ...typography.body, color: colors.textMuted },
  });
}
