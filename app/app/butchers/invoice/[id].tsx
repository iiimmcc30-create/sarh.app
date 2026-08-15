import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { getRtlText, getRtlRow } from '@/lib/rtl';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import {
  CUT_LABELS,
  CutType,
  PAYMENT_STATUS_LABELS,
} from '@/services/butcherData';
import { ButcherOrderRecord, formatCurrency, formatOrderDate } from '@/services/butcherOrders';

function InvoiceRow({
  label,
  value,
  styles,
  highlight,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.row, getRtlRow()]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [invoice, setInvoice] = useState<ButcherOrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id || !accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/butchers/orders/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setInvoice(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenHeader title="تفاصيل الفاتورة" showBack />
        <ActivityIndicator size="large" color={colors.electricBright} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScreenHeader title="تفاصيل الفاتورة" showBack />
        <Text style={styles.error}>تعذر تحميل الفاتورة</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader title="تفاصيل الفاتورة" showBack />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.paper}>
          <View style={styles.paperHeader}>
            <View style={styles.logoMark}>
              <AppIcon name="storefront-outline" size={28} color={colors.electricBright} />
            </View>
            <Text style={styles.brand}>سرح · سوق الملاحم</Text>
            <Text style={styles.invoiceTitle}>فاتورة ضريبية مبسطة</Text>
            <Text style={styles.invoiceNo}>#{invoice.orderNumber}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>بيانات الفاتورة</Text>
            <InvoiceRow label="رقم الطلب" value={invoice.orderNumber} styles={styles} />
            <InvoiceRow
              label="اسم الملحمة"
              value={invoice.butcher?.nameAr ?? '—'}
              styles={styles}
            />
            <InvoiceRow
              label="تاريخ الشراء"
              value={formatOrderDate(invoice.createdAt)}
              styles={styles}
            />
            <InvoiceRow
              label="حالة الدفع"
              value={PAYMENT_STATUS_LABELS[invoice.paymentStatus]}
              styles={styles}
              highlight={invoice.paymentStatus === 'paid'}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تفاصيل المنتجات</Text>
            <InvoiceRow
              label="المنتج"
              value={invoice.product?.nameAr ?? '—'}
              styles={styles}
            />
            <InvoiceRow
              label="التقطيع"
              value={CUT_LABELS[invoice.cutType as CutType]?.ar ?? invoice.cutType}
              styles={styles}
            />
            <InvoiceRow label="الكمية" value={`${invoice.weightKg} كغ`} styles={styles} />
            <InvoiceRow
              label="سعر المنتج"
              value={formatCurrency(invoice.totalPrice, invoice.currency)}
              styles={styles}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الملخص المالي</Text>
            <InvoiceRow label="رسوم التوصيل" value="—" styles={styles} />
            <InvoiceRow label="الضريبة" value="—" styles={styles} />
            <InvoiceRow label="الخصومات" value="—" styles={styles} />
            <View style={styles.grandTotal}>
              <Text style={styles.grandLabel}>المبلغ المدفوع</Text>
              <Text style={styles.grandValue}>
                {formatCurrency(invoice.totalPrice, invoice.currency)}
              </Text>
            </View>
          </View>

          <Text style={styles.footerNote}>
            شكراً لتسوقك من سوق الملاحم في سرح
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    scroll: { padding: spacing.lg, paddingBottom: 40 },
    paper: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      padding: spacing.xl,
      gap: spacing.lg,
    },
    paperHeader: { alignItems: 'center', gap: spacing.xs },
    logoMark: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.electric + '18',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    brand: {
      ...butcherTypography.secondary,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
    invoiceTitle: {
      ...butcherTypography.title,
      color: colors.textPrimary,
      writingDirection: 'rtl',
    },
    invoiceNo: {
      ...butcherTypography.primary,
      color: colors.electricBright,
    },
    section: { gap: spacing.sm },
    sectionTitle: {
      ...butcherTypography.primary,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      ...getRtlText(),
      marginBottom: spacing.xs,
      paddingBottom: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    row: {
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: 4,
    },
    rowLabel: {
      ...butcherTypography.secondary,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
    rowValue: {
      ...butcherTypography.emphasis,
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    rowValueHighlight: { ...butcherTypography.emphasis, color: colors.success },
    grandTotal: {
      marginTop: spacing.sm,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderMid,
      alignItems: 'center',
      gap: 4,
    },
    grandLabel: {
      ...butcherTypography.secondary,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
    grandValue: {
      ...butcherTypography.titleLarge,
      color: colors.electricBright,
    },
    footerNote: {
      ...butcherTypography.secondary,
      color: colors.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
      marginTop: spacing.sm,
    },
    error: {
      ...butcherTypography.body,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 80,
    },
  });
}
