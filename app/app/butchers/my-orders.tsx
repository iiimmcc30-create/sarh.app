import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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
import { getRtlText, getRtlRow } from '@/lib/rtl';
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

function OrderCard({
  order,
  onPress,
  colors,
  styles,
}: {
  order: ButcherOrderRecord;
  onPress: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const statusColor = ORDER_STATUS_COLORS[order.status] ?? colors.textMuted;
  const statusText = orderStatusLabel(order.status, order.deliveryType);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] }]}
    >
      <View style={[styles.cardHeader, getRtlRow()]}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.butcherName}>{order.butcher?.nameAr ?? 'ملحمة'}</Text>
          <Text style={styles.orderDate}>{formatOrderDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>المنتج</Text>
        <Text style={styles.detailValue}>{order.product?.nameAr ?? '—'}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>الكمية</Text>
        <Text style={styles.detailValue}>{order.weightKg} كغ</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>التقطيع</Text>
        <Text style={styles.detailValue}>
          {CUT_LABELS[order.cutType as CutType]?.ar ?? order.cutType}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>التوصيل</Text>
        <Text style={styles.detailValue}>
          {order.deliveryType === 'delivery' ? 'توصيل' : 'استلام من الملحمة'}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>طريقة الدفع</Text>
        <Text style={styles.detailValue}>دفع إلكتروني</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>حالة الدفع</Text>
        <Text style={[styles.detailValue, order.paymentStatus === 'paid' && { color: colors.success }]}>
          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </Text>
      </View>

      <View style={[styles.totalRow, getRtlRow()]}>
        <Text style={styles.totalLabel}>الإجمالي</Text>
        <Text style={styles.totalValue}>{formatCurrency(order.totalPrice, order.currency)}</Text>
      </View>
    </Pressable>
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

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader
        title="طلباتي"
        showBack
        rightIcon="menu-burger"
        onRightPress={() => router.push('/butchers-market-sidebar')}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.electricBright} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
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
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyTitle}>لا توجد طلبات بعد</Text>
              <Text style={styles.emptySub}>تصفّح الملاحم واطلب منتجاتك المفضلة</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/butchers')}>
                <Text style={styles.emptyBtnText}>تصفح الملاحم</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {activeOrders.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>الطلب الحالي</Text>
                  {activeOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      colors={colors}
                      styles={styles}
                      onPress={() =>
                        router.push({ pathname: '/butchers/order/[id]', params: { id: order.id } })
                      }
                    />
                  ))}
                </View>
              ) : null}

              {pastOrders.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>الطلبات السابقة</Text>
                  {pastOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      colors={colors}
                      styles={styles}
                      onPress={() =>
                        router.push({ pathname: '/butchers/order/[id]', params: { id: order.id } })
                      }
                    />
                  ))}
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    scroll: { padding: spacing.lg, paddingBottom: 40, gap: spacing.lg },
    section: { gap: spacing.md },
    sectionTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      ...getRtlText(),
      marginBottom: spacing.xs,
    },
    card: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardHeader: {
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    cardHeaderText: { flex: 1, gap: 3 },
    orderNumber: {
      ...typography.bodyStrong,
      color: colors.electricBright,
      fontWeight: '600',
      writingDirection: 'rtl',
      ...getRtlText(),
    },
    butcherName: {
      ...typography.h3,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      ...getRtlText(),
    },
    orderDate: {
      ...typography.caption,
      color: colors.textMuted,
      writingDirection: 'rtl',
      ...getRtlText(),
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    statusText: {
      ...typography.micro,
      fontWeight: '600',
      writingDirection: 'rtl',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderHairline,
      marginVertical: spacing.xs,
    },
    detailRow: {
      ...getRtlRow(),
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    detailLabel: {
      ...typography.caption,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
    detailValue: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '600',
      flex: 1,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    totalRow: {
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderHairline,
    },
    totalLabel: {
      ...typography.bodyStrong,
      color: colors.textSecondary,
      writingDirection: 'rtl',
    },
    totalValue: {
      ...typography.h3,
      color: colors.electricBright,
      fontWeight: '600',
    },
    empty: {
      alignItems: 'center',
      paddingVertical: 80,
      gap: spacing.sm,
    },
    emptyIcon: { fontSize: 48 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary },
    emptySub: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
      paddingHorizontal: spacing.xl,
    },
    emptyBtn: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: 12,
      borderRadius: radius.pill,
      backgroundColor: colors.electric,
    },
    emptyBtnText: {
      ...typography.bodyStrong,
      color: '#fff',
      fontWeight: '600',
      writingDirection: 'rtl',
    },
  });
}
