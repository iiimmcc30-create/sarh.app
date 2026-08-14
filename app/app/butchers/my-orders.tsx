import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import {
  CUT_LABELS,
  CutType,
  ORDER_STATUS_COLORS,
  orderStatusLabel,
  PAYMENT_STATUS_LABELS,
} from '@/services/butcherData';
import {
  ButcherOrderRecord,
  fetchMyButcherOrders,
  formatCurrency,
  formatOrderDate,
  isActiveOrder,
} from '@/services/butcherOrders';
import { butcherChatRouteParams, isOrderChatEligible } from '@/services/butcherChat';

function orderProductSummary(order: ButcherOrderRecord): string {
  const items = order.items ?? [];
  if (items.length > 1) {
    const first = items[0]?.product?.nameAr ?? 'منتج';
    return `${first} + ${items.length - 1} أصناف`;
  }
  if (items.length === 1) {
    return items[0]?.product?.nameAr ?? order.product?.nameAr ?? 'منتج';
  }
  return order.product?.nameAr ?? '—';
}

function OrderCard({
  order,
  onPress,
  onChat,
  colors,
  styles,
}: {
  order: ButcherOrderRecord;
  onPress: () => void;
  onChat?: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const statusColor = ORDER_STATUS_COLORS[order.status] ?? colors.textMuted;
  const statusText = orderStatusLabel(order.status, order.deliveryType);
  const isPaid = order.paymentStatus === 'paid';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}
    >
      <View style={styles.coverTrail}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColor + '1F', borderColor: statusColor + '44' },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
        <View style={styles.rtlTextShellFlex}>
          <Text style={styles.butcherName} numberOfLines={1}>
            {order.butcher?.nameAr ?? 'ملحمة'}
          </Text>
          <Text style={styles.orderDate}>{formatOrderDate(order.createdAt)}</Text>
        </View>
        <View style={styles.logoWrap}>
          <Image source={uriSource(order.butcher?.logo)} style={styles.logo} contentFit="cover" />
        </View>
      </View>

      <View style={styles.coverTrail}>
        <View style={styles.rtlTextShellFlex}>
          <Text style={styles.productName} numberOfLines={1}>
            {orderProductSummary(order)}
          </Text>
          <Text style={styles.productMeta} numberOfLines={1}>
            {order.weightKg} كغ · {CUT_LABELS[order.cutType as CutType]?.ar ?? order.cutType} ·{' '}
            {order.deliveryType === 'delivery' ? 'توصيل' : 'استلام'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.coverTrail}>
        <View style={styles.totalShell}>
          <Text style={styles.totalValue}>{formatCurrency(order.totalPrice, order.currency)}</Text>
          <Text style={styles.totalLabel}>الإجمالي</Text>
        </View>
        <View style={styles.rtlTextShellFlex}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <View
            style={[
              styles.payChip,
              { backgroundColor: (isPaid ? colors.success : colors.gold) + '1F', alignSelf: 'flex-end' },
            ]}
          >
            <Text style={[styles.payText, { color: isPaid ? colors.success : colors.gold }]}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </Text>
          </View>
        </View>
      </View>

      {onChat ? (
        <Pressable
          style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.88 }]}
          onPress={onChat}
        >
          <View style={styles.coverTrail}>
            <View style={styles.rtlTextShellFlex}>
              <Text style={styles.chatBtnText}>محادثة الملحمة</Text>
            </View>
            <AppIcon name="chatbubbles-outline" size={17} color={colors.electricBright} />
          </View>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function SkeletonCard({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.card}>
      <View style={styles.coverTrail}>
        <View style={[styles.skeleton, { width: 72, height: 24, borderRadius: 999 }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[styles.skeleton, { width: 120, height: 14, borderRadius: 6, alignSelf: 'flex-end' }]} />
          <View style={[styles.skeleton, { width: 80, height: 10, borderRadius: 6, alignSelf: 'flex-end' }]} />
        </View>
        <View style={[styles.logoWrap, styles.skeleton]} />
      </View>
      <View style={[styles.skeleton, { width: '100%', height: 40, borderRadius: 10, marginTop: spacing.sm }]} />
      <View style={styles.divider} />
      <View style={[styles.skeleton, { width: '60%', height: 20, borderRadius: 8, alignSelf: 'flex-end' }]} />
    </View>
  );
}

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
          router.push(
            butcherChatRouteParams({
              butcherId: order.butcherId,
              orderId: order.id,
              receiverName: order.butcher?.nameAr,
              receiverAvatar: order.butcher?.logo,
            }),
          )
      : undefined;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="طلباتي" />

      {loading ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} styles={styles} />
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
              <View style={styles.rtlTextShell}>
                <Text style={styles.emptyTitle}>لا توجد طلبات بعد</Text>
              </View>
              <View style={styles.rtlTextShell}>
                <Text style={styles.emptySub}>تصفّح الملاحم واطلب منتجاتك المفضلة</Text>
              </View>
              <Pressable style={styles.emptyBtn} onPress={() => router.replace('/butchers')}>
                <Text style={styles.emptyBtnText}>تصفح الملاحم</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {activeOrders.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.rtlTextShell}>
                    <Text style={styles.sectionTitle}>الطلبات الحالية</Text>
                  </View>
                  {activeOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      colors={colors}
                      styles={styles}
                      onPress={() =>
                        router.push({ pathname: '/butchers/order/[id]', params: { id: order.id } })
                      }
                      onChat={chatHandler(order)}
                    />
                  ))}
                </View>
              ) : null}

              {pastOrders.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.rtlTextShell}>
                    <Text style={styles.sectionTitle}>الطلبات السابقة</Text>
                  </View>
                  {pastOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      colors={colors}
                      styles={styles}
                      onPress={() =>
                        router.push({ pathname: '/butchers/order/[id]', params: { id: order.id } })
                      }
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    flex: { flex: 1 },
    scroll: { padding: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg },
    section: { gap: spacing.md },
    rtlTextShell: { width: '100%', direction: 'ltr' },
    rtlTextShellFlex: { flex: 1, minWidth: 0, direction: 'ltr' },
    coverTrail: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    card: {
      backgroundColor: colors.bgElevated,
      borderRadius: 14,
      padding: spacing.lg,
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    logoWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: colors.bgSurface,
      flexShrink: 0,
    },
    logo: { width: '100%', height: '100%' },
    butcherName: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    orderDate: {
      ...typography.micro,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { ...typography.micro, fontWeight: '700', writingDirection: 'rtl' },
    productName: {
      ...typography.bodyStrong,
      fontSize: 14,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    productMeta: {
      ...typography.micro,
      color: colors.textMuted,
      marginTop: 2,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSoft,
    },
    orderNumber: {
      ...typography.micro,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    payChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    payText: { ...typography.micro, fontWeight: '700', writingDirection: 'rtl' },
    totalShell: { alignItems: 'flex-end', gap: 1, flexShrink: 0 },
    totalValue: {
      ...typography.h3,
      color: colors.textPrimary,
      fontWeight: '700',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    totalLabel: {
      ...typography.micro,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    chatBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: 12,
      borderRadius: radius.lg,
      backgroundColor: colors.electric + '16',
    },
    chatBtnText: {
      ...typography.bodyStrong,
      fontSize: 14,
      color: colors.electricBright,
      fontWeight: '700',
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    skeleton: {
      backgroundColor: colors.bgSurface,
      opacity: 0.7,
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
      ...typography.h3,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    emptySub: {
      ...typography.caption,
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
      ...typography.bodyStrong,
      color: '#fff',
      fontWeight: '700',
      writingDirection: 'rtl',
    },
  });
}
