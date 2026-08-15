import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
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
import { radius, spacing, type ThemeColors } from '@/constants/theme';
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
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

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
      <CoverTrailRow justify="flex-end" gap={spacing.sm}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColor + '1F', borderColor: statusColor + '44' },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
        <RtlTextShell flex>
          <RtlText style={styles.butcherName} numberOfLines={1}>
            {order.butcher?.nameAr ?? 'ملحمة'}
          </RtlText>
          <RtlText style={styles.orderDate}>{formatOrderDate(order.createdAt)}</RtlText>
        </RtlTextShell>
        <View style={styles.logoWrap}>
          <Image source={uriSource(order.butcher?.logo)} style={styles.logo} contentFit="cover" />
        </View>
      </CoverTrailRow>

      <CoverTrailRow justify="flex-end" gap={spacing.sm}>
        <RtlTextShell flex>
          <RtlText style={styles.productName} numberOfLines={1}>
            {orderProductSummary(order)}
          </RtlText>
          <RtlText style={styles.productMeta} numberOfLines={1}>
            {order.weightKg} كغ · {CUT_LABELS[order.cutType as CutType]?.ar ?? order.cutType} ·{' '}
            {order.deliveryType === 'delivery' ? 'توصيل' : 'استلام'}
          </RtlText>
        </RtlTextShell>
      </CoverTrailRow>

      <View style={styles.divider} />

      <CoverTrailRow justify="flex-end" gap={spacing.sm}>
        <View style={styles.totalShell}>
          <Text style={styles.totalValue}>{formatCurrency(order.totalPrice, order.currency)}</Text>
          <Text style={styles.totalLabel}>الإجمالي</Text>
        </View>
        <RtlTextShell flex>
          <RtlText style={styles.orderNumber}>#{order.orderNumber}</RtlText>
          <View
            style={[
              styles.payChip,
              { backgroundColor: (isPaid ? colors.success : colors.gold) + '1F', alignSelf: 'flex-end' },
            ]}
          >
            <RtlText style={[styles.payText, { color: isPaid ? colors.success : colors.gold }]}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </RtlText>
          </View>
        </RtlTextShell>
      </CoverTrailRow>

      {onChat ? (
        <Pressable
          style={({ pressed }) => [styles.chatBtn, pressed && { opacity: 0.88 }]}
          onPress={onChat}
        >
          <CoverTrailRow justify="flex-end" gap={spacing.sm}>
            <RtlTextShell flex>
              <RtlText style={styles.chatBtnText}>محادثة الملحمة</RtlText>
            </RtlTextShell>
            <AppIcon name="chatbubbles-outline" size={17} color={colors.electricBright} />
          </CoverTrailRow>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function SkeletonCard({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.card}>
      <CoverTrailRow justify="flex-end" gap={spacing.sm}>
        <View style={[styles.skeleton, { width: 72, height: 24, borderRadius: 999 }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[styles.skeleton, { width: 120, height: 14, borderRadius: 6, alignSelf: 'flex-end' }]} />
          <View style={[styles.skeleton, { width: 80, height: 10, borderRadius: 6, alignSelf: 'flex-end' }]} />
        </View>
        <View style={[styles.logoWrap, styles.skeleton]} />
      </CoverTrailRow>
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
                    <OrderCard
                      key={order.id}
                      order={order}
                      colors={colors}
                      styles={styles}
                      onPress={() =>
                        safePush({ pathname: '/butchers/order/[id]', params: { id: order.id } }, undefined, router)
                      }
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
                    <OrderCard
                      key={order.id}
                      order={order}
                      colors={colors}
                      styles={styles}
                      onPress={() =>
                        safePush({ pathname: '/butchers/order/[id]', params: { id: order.id } }, undefined, router)
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
    sectionTitle: {
      ...butcherTypography.title,
      color: colors.textPrimary,
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
      ...butcherTypography.primary,
      color: colors.textPrimary,
    },
    orderDate: {
      ...butcherTypography.meta,
      color: colors.textMuted,
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
    statusText: { ...butcherTypography.emphasis, writingDirection: 'rtl' },
    productName: {
      ...butcherTypography.primary,
      fontSize: 14,
      color: colors.textPrimary,
    },
    productMeta: {
      ...butcherTypography.meta,
      color: colors.textMuted,
      marginTop: 2,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSoft,
    },
    orderNumber: {
      ...butcherTypography.meta,
      color: colors.textMuted,
    },
    payChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    payText: { ...butcherTypography.emphasis, writingDirection: 'rtl' },
    totalShell: { alignItems: 'flex-end', gap: 1, flexShrink: 0 },
    totalValue: {
      ...butcherTypography.title,
      color: colors.textPrimary,
    },
    totalLabel: {
      ...butcherTypography.meta,
      color: colors.textMuted,
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
      ...butcherTypography.primary,
      fontSize: 14,
      color: colors.electricBright,
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
