// Customer order details with realtime timeline
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gradients, radius, spacing, typography } from '@/constants/theme';
import { rtlBackIcon, getRtlRow, getRtlText } from '@/lib/rtl';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import { CUT_LABELS, CutType } from '@/services/butcherData';
import { useOrderSocket } from '@/hooks/useOrderSocket';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

const STATUS_COLORS: Record<string, string> = {
  pending: colors.amber,
  confirmed: colors.electricBright,
  preparing: colors.cyan,
  ready: colors.success,
  delivered: colors.success,
  cancelled: colors.danger,
};

const FLOW: string[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    if (!id || !accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/butchers/orders/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setOrder(json.data);
      }
    } catch (err) {
      console.warn('[OrderDetails] load failed', err);
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useOrderSocket(accessToken, id, () => {
    loadOrder();
  });

  if (loading) {
    return (
      <SafeAreaView style={s.screen}>
        <ActivityIndicator size="large" color={colors.electricBright} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={s.screen}>
        <Text style={s.errorText}>تعذر تحميل تفاصيل الطلب</Text>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[order.status] ?? colors.textMuted;
  const timeline: any[] = Array.isArray(order.timeline) ? order.timeline : [];
  const reached = new Set(timeline.map((t) => t.status));

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />

      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>تفاصيل الطلب</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.card}>
          <Text style={s.orderNumber}>{order.orderNumber}</Text>
          <View style={[s.badge, { borderColor: statusColor + '88', backgroundColor: statusColor + '22' }]}>
            <Text style={[s.badgeText, { color: statusColor }]}>
              {STATUS_LABELS[order.status] ?? order.status}
            </Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>متابعة الطلب</Text>
          {order.status === 'cancelled' ? (
            timeline.map((event) => (
              <View key={event.id} style={s.timelineItem}>
                <View style={s.timelineTrack}>
                  <View style={[s.timelineDot, { backgroundColor: colors.danger, borderColor: colors.danger + '55' }]} />
                </View>
                <View style={s.timelineContent}>
                  <Text style={[s.timelineLabel, s.timelineDone]}>
                    {STATUS_LABELS[event.status] ?? event.status}
                  </Text>
                  {event.note ? <Text style={s.timelineNote}>{event.note}</Text> : null}
                </View>
              </View>
            ))
          ) : (
            FLOW.map((step, index) => {
              const done = reached.has(step) || FLOW.indexOf(order.status) >= index;
              const active = order.status === step;
              const stepColor = done ? colors.electric : colors.textSubtle;
              return (
                <View key={step} style={s.timelineItem}>
                  <View style={s.timelineTrack}>
                    <View
                      style={[
                        s.timelineDot,
                        done && s.timelineDotDone,
                        active && s.timelineDotActive,
                        { borderColor: stepColor + '66' },
                      ]}
                    >
                      {done ? (
                        <AppIcon name="checkmark" size={12} color="#fff" />
                      ) : null}
                    </View>
                    {index < FLOW.length - 1 ? (
                      <View style={[s.timelineLine, done && { backgroundColor: colors.electric + '55' }]} />
                    ) : null}
                  </View>
                  <View style={s.timelineContent}>
                    <Text style={[s.timelineLabel, done && s.timelineDone, active && s.timelineActive]}>
                      {STATUS_LABELS[step]}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>تفاصيل الطلب</Text>
          {Array.isArray(order.items) && order.items.length > 0 ? (
            order.items.map((item: {
              id: string;
              cutType: string;
              weightKg: number;
              linePrice: number;
              product?: { nameAr?: string };
            }) => (
              <View key={item.id} style={s.itemBlock}>
                <Row label="المنتج" value={item.product?.nameAr ?? '—'} />
                <Row
                  label="التقطيع"
                  value={CUT_LABELS[item.cutType as CutType]?.ar ?? item.cutType}
                />
                <Row label="الوزن" value={`${item.weightKg} كغ`} />
                <Row label="السعر" value={`${item.linePrice} ${order.currency || 'SAR'}`} />
              </View>
            ))
          ) : (
            <>
              <Row label="المنتج" value={order.product?.nameAr ?? '—'} />
              <Row label="التقطيع" value={CUT_LABELS[order.cutType as CutType]?.ar ?? order.cutType} />
              <Row label="الوزن" value={`${order.weightKg} كغ`} />
              <Row label="الكمية المحجوزة" value={`${order.reservedQuantity ?? order.weightKg} كغ`} />
            </>
          )}
          <Row label="الإجمالي" value={`${order.totalPrice} ${order.currency || 'SAR'}`} />
          <Row
            label="الاستلام"
            value={order.deliveryType === 'delivery' ? 'توصيل' : 'استلام من الملحمة'}
          />
          {order.deliveryAddress ? <Row label="العنوان" value={order.deliveryAddress} /> : null}
          {order.notes ? <Row label="ملاحظات" value={order.notes} /> : null}
          {order.cancellationReason ? (
            <Row label="سبب الإلغاء" value={order.cancellationReason} />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenRoot },
  header: {
    ...getRtlRow(),
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  orderNumber: {
    ...typography.h2,
    color: colors.textPrimary,
    ...getRtlText(),
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeText: { ...typography.caption, fontWeight: '600', ...getRtlText(), },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    ...getRtlText(),
    marginBottom: spacing.sm,
  },
  timelineItem: {
    ...getRtlRow(),
    alignItems: 'flex-start',
    gap: spacing.md,
    minHeight: 48,
  },
  timelineTrack: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderMid,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: colors.electric,
    borderColor: colors.electric,
  },
  timelineDotActive: {
    shadowColor: colors.electric,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: colors.borderSoft,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.sm,
  },
  timelineLabel: { ...typography.body, color: colors.textMuted, ...getRtlText(), },
  timelineDone: { color: colors.textPrimary, fontWeight: '600' },
  timelineActive: { color: colors.electricBright, fontWeight: '600' },
  timelineNote: { ...typography.caption, color: colors.textMuted, ...getRtlText(), marginTop: 2 },
  row: {
    ...getRtlRow(),
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 4,
  },
  rowLabel: { ...typography.caption, color: colors.textMuted, ...getRtlText(), },
  rowValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    ...getRtlText(),
  },
  itemBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    gap: 2,
  },
  errorText: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: 80 },
});
