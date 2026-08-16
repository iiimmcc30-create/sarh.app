import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
import { CustomerOrderCard, CustomerOrderCardSkeleton } from '@/components/butchers/CustomerOrderCard';
import { useFocusEffect, useRouter } from 'expo-router';
import { safePush } from '@/lib/safeNavigate';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { butcherTypography } from '@/constants/butcherTypography';
import { radius, spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import {
  ButcherOrderRecord,
  fetchMyButcherOrders,
  isActiveOrder,
} from '@/services/butcherOrders';
import { butcherChatRouteParams, isOrderChatEligible } from '@/services/butcherChat';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

export default function MyOrdersScreen() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [orders, setOrders] = useState<ButcherOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchMyButcherOrders(accessToken);
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const activeOrders = orders.filter(isActiveOrder);
  const pastOrders = orders.filter((o) => !isActiveOrder(o));

  const chatHandler = (order: ButcherOrderRecord) =>
    isOrderChatEligible(order.status)
      ? () =>
          safePush(
            butcherChatRouteParams({
              butcherId: order.butcherId,
              orderId: order.id,
              receiverName: order.butcher?.nameAr,
              receiverAvatar: order.butcher?.logo,
            }),
            undefined,
            router,
          )
      : undefined;

  const openOrder = (order: ButcherOrderRecord) =>
    safePush({ pathname: '/butchers/order/[id]', params: { id: order.id } }, undefined, router);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="طلباتي" />

      {loading ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {[0, 1, 2].map((i) => (
            <CustomerOrderCardSkeleton key={i} colors={colors} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.electricBright}
            />
          }
        >
          {orders.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <AppIcon name="bag-outline" size={34} color={colors.electricBright} />
              </View>
              <RtlTextShell>
                <RtlText style={styles.emptyTitle}>لا توجد طلبات بعد</RtlText>
              </RtlTextShell>
              <RtlTextShell>
                <RtlText style={styles.emptySub}>تصفّح الملاحم واطلب منتجاتك المفضلة</RtlText>
              </RtlTextShell>
              <Pressable style={styles.emptyBtn} onPress={() => router.replace('/butchers')}>
                <Text style={styles.emptyBtnText}>تصفح الملاحم</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {activeOrders.length > 0 ? (
                <View style={styles.section}>
                  <RtlTextShell>
                    <RtlText style={styles.sectionTitle}>الطلبات الحالية</RtlText>
                  </RtlTextShell>
                  {activeOrders.map((order) => (
                    <CustomerOrderCard
                      key={order.id}
                      order={order}
                      colors={colors}
                      onPress={() => openOrder(order)}
                      onChat={chatHandler(order)}
                    />
                  ))}
                </View>
              ) : null}

              {pastOrders.length > 0 ? (
                <View style={styles.section}>
                  <RtlTextShell>
                    <RtlText style={styles.sectionTitle}>الطلبات السابقة</RtlText>
                  </RtlTextShell>
                  {pastOrders.map((order) => (
                    <CustomerOrderCard
                      key={order.id}
                      order={order}
                      colors={colors}
                      onPress={() => openOrder(order)}
                      onChat={chatHandler(order)}
                    />
                  ))}
                </View>
              ) : null}
            </>
          )}
          <View style={{ height: spacing.md }} />
        </ScrollView>
      )}

      <ButchersTabBar active="orders" />
    </SafeAreaView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    flex: { flex: 1 },
    scroll: { padding: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg },
    section: { gap: spacing.md },
    sectionTitle: {
      ...butcherTypography.title,
      color: colors.textPrimary,
    },
    empty: {
      alignItems: 'center',
      paddingVertical: 80,
      gap: spacing.sm,
    },
    emptyIconWrap: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.electric + '14',
      marginBottom: spacing.xs,
    },
    emptyTitle: {
      ...butcherTypography.title,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    emptySub: {
      ...butcherTypography.secondary,
      color: colors.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
      paddingHorizontal: spacing.xl,
      width: '100%',
    },
    emptyBtn: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.xxl,
      paddingVertical: 13,
      borderRadius: radius.pill,
      backgroundColor: colors.electric,
    },
    emptyBtnText: {
      ...butcherTypography.primary,
      color: '#fff',
      writingDirection: 'rtl',
    },
  });
}
