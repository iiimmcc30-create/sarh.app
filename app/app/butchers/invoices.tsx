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
import { PAYMENT_STATUS_LABELS } from '@/services/butcherData';
import {
  ButcherOrderRecord,
  fetchMyButcherOrders,
  formatCurrency,
  formatOrderDate,
  isInvoiceOrder,
} from '@/services/butcherOrders';

export default function ButcherInvoicesScreen() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [invoices, setInvoices] = useState<ButcherOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    try {
      const orders = await fetchMyButcherOrders(accessToken);
      setInvoices(orders.filter(isInvoiceOrder));
    } catch {
      setInvoices([]);
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

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader
        title="الفواتير"
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
          {invoices.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>لا توجد فواتير بعد</Text>
              <Text style={styles.emptySub}>
                تظهر هنا الفواتير الخاصة بالطلبات المكتملة والمدفوعة
              </Text>
            </View>
          ) : (
            invoices.map((invoice) => (
              <Pressable
                key={invoice.id}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
                onPress={() =>
                  router.push({ pathname: '/butchers/invoice/[id]', params: { id: invoice.id } })
                }
              >
                <View style={[styles.cardTop, getRtlRow()]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invoiceNo}>فاتورة #{invoice.orderNumber}</Text>
                    <Text style={styles.butcherName}>{invoice.butcher?.nameAr ?? 'ملحمة'}</Text>
                    <Text style={styles.date}>{formatOrderDate(invoice.createdAt)}</Text>
                  </View>
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidText}>{PAYMENT_STATUS_LABELS.paid}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <Text style={styles.productLine} numberOfLines={1}>
                  {invoice.product?.nameAr ?? 'منتج'} · {invoice.weightKg} كغ
                </Text>
                <View style={[styles.totalRow, getRtlRow()]}>
                  <Text style={styles.totalLabel}>المبلغ المدفوع</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(invoice.totalPrice, invoice.currency)}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    scroll: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
    card: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTop: { alignItems: 'flex-start', gap: spacing.md },
    invoiceNo: {
      ...typography.bodyStrong,
      color: colors.electricBright,
      fontWeight: '800',
      writingDirection: 'rtl',
      ...getRtlText(),
    },
    butcherName: {
      ...typography.h3,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      ...getRtlText(),
    },
    date: {
      ...typography.caption,
      color: colors.textMuted,
      writingDirection: 'rtl',
      ...getRtlText(),
    },
    paidBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      backgroundColor: colors.success + '22',
      borderWidth: 1,
      borderColor: colors.success + '55',
    },
    paidText: {
      ...typography.micro,
      color: colors.success,
      fontWeight: '800',
      writingDirection: 'rtl',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderHairline,
    },
    productLine: {
      ...typography.caption,
      color: colors.textSecondary,
      writingDirection: 'rtl',
      ...getRtlText(),
    },
    totalRow: { justifyContent: 'space-between', marginTop: spacing.xs },
    totalLabel: {
      ...typography.caption,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
    totalValue: {
      ...typography.h3,
      color: colors.textPrimary,
      fontWeight: '800',
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
  });
}
