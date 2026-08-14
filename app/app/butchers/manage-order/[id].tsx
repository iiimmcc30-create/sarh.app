import { AppIcon } from '@/components/ui/FlaticonIcon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography } from '@/constants/theme';
import { rtlBackIcon } from '@/lib/rtl';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import { PAYMENT_STATUS_LABELS, cutLabelAr } from '@/services/butcherData';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import {
  OPS_FLOW_DELIVERY,
  OPS_FLOW_PICKUP,
  flowStepActive,
  flowStepDone,
  isDeliveryOrder,
  mapsUrlForAddress,
  opsStatusLabel,
  orderCustomerName,
  orderShortId,
  primaryAdvanceAction,
} from '@/lib/butcherOps';

const CANCEL_REASONS = [
  'المنتج غير متوفر',
  'الكمية غير كافية',
  'تعذر التواصل مع العميل',
  'طلب خارج نطاق الخدمة',
] as const;

export default function ButcherManageOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReasonPreset, setCancelReasonPreset] = useState<string>(CANCEL_REASONS[0]);
  const [cancelReasonCustom, setCancelReasonCustom] = useState('');

  const loadOrder = useCallback(async () => {
    if (!id || !accessToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/butchers/orders/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (res.ok && json.success) setOrder(json.data);
    } catch (err) {
      console.warn('[ManageOrder] load failed', err);
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

  const transition = async (nextStatus: string, cancellationReason?: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/butchers/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          status: nextStatus,
          ...(cancellationReason ? { cancellationReason } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setOrder((prev: any) => ({ ...prev, ...json.data, status: nextStatus }));
      } else {
        Alert.alert('خطأ', json.messageAr || json.message || 'فشل تحديث حالة الطلب');
      }
    } catch {
      Alert.alert('خطأ', 'تعذر الاتصال بالخادم');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.screen}>
        <ActivityIndicator size="large" color="#20B66F" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={s.screen}>
        <Text style={s.error}>تعذر تحميل تفاصيل الطلب</Text>
      </SafeAreaView>
    );
  }

  const delivery = isDeliveryOrder(order);
  const flow = delivery ? OPS_FLOW_DELIVERY : OPS_FLOW_PICKUP;
  const action = primaryAdvanceAction(order);
  const customer = orderCustomerName(order);
  const phone = order.customer?.phone as string | undefined;
  const address = delivery
    ? order.deliveryAddress || 'لم يُحدد عنوان التوصيل'
    : [order.butcher?.addressAr, order.butcher?.cityAr].filter(Boolean).join('، ') || 'استلام من الملحمة';
  const items = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [{ product: order.product, cutType: order.cutType, weightKg: order.weightKg, lineTotal: order.totalPrice }];
  const allowed: string[] = Array.isArray(order.allowedNextStatuses) ? order.allowedNextStatuses : [];

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <AppIcon name={rtlBackIcon()} size={20} color="#F4F6F5" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{orderShortId(order)}</Text>
          <Text style={s.headerSub}>{opsStatusLabel(order.status, order.deliveryType)}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.card}>
          <Text style={s.section}>معلومات العميل</Text>
          <Text style={s.value}>{customer}</Text>
          {phone ? (
            <Pressable onPress={() => void Linking.openURL(`tel:${phone}`)} style={s.row}>
              <AppIcon name="call-outline" size={16} color="#20B66F" />
              <Text style={s.link}>{phone}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={s.card}>
          <Text style={s.section}>المنتجات</Text>
          {items.map((item: any, idx: number) => (
            <View key={item.id || idx} style={s.itemRow}>
              <Text style={s.itemName}>{item.product?.nameAr || 'منتج'}</Text>
              <Text style={s.muted}>
                {item.cutType ? `${cutLabelAr(item.cutType)} · ` : ''}
                {item.weightKg != null ? `${item.weightKg} كغ` : ''}
              </Text>
              <Text style={s.value}>
                {Number(item.lineTotal ?? item.totalPrice ?? 0).toLocaleString()} {order.currency || 'ر.س'}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.section}>الدفع</Text>
          <Text style={s.value}>
            {PAYMENT_STATUS_LABELS[order.paymentStatus as 'paid' | 'unpaid'] ?? order.paymentStatus}
          </Text>
          <Text style={s.muted}>الإجمالي {Number(order.totalPrice || 0).toLocaleString()} {order.currency || 'ر.س'}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.section}>التوصيل</Text>
          <Text style={s.value}>{delivery ? 'توصيل الملحمة' : 'استلام من الملحمة'}</Text>
          <Text style={s.muted}>{address}</Text>
          {order.createdAt ? (
            <Text style={s.muted}>وقت الطلب: {new Date(order.createdAt).toLocaleString('ar-SA')}</Text>
          ) : null}
          {delivery && order.deliveryAddress ? (
            <Pressable
              style={s.mapBtn}
              onPress={() => void Linking.openURL(mapsUrlForAddress(String(order.deliveryAddress)))}
            >
              <AppIcon name="navigate-outline" size={16} color="#20B66F" />
              <Text style={s.link}>فتح الموقع</Text>
            </Pressable>
          ) : null}
        </View>

        {order.notes ? (
          <View style={s.card}>
            <Text style={s.section}>ملاحظات العميل</Text>
            <Text style={s.value}>{order.notes}</Text>
          </View>
        ) : null}

        <View style={s.card}>
          <Text style={s.section}>متابعة الطلب</Text>
          {order.status === 'cancelled' ? (
            <Text style={[s.value, { color: '#E85D5D' }]}>ملغى</Text>
          ) : (
            flow.map((step) => {
              const done = flowStepDone(order.status, step.id, delivery);
              const active = flowStepActive(order.status, step.id, delivery);
              return (
                <View key={step.id} style={s.tlRow}>
                  <View style={[s.tlDot, done && s.tlDotDone, active && s.tlDotActive]}>
                    {done ? <AppIcon name="checkmark" size={10} color="#fff" /> : null}
                  </View>
                  <Text style={[s.tlLabel, done && s.tlDone, active && s.tlActive]}>{step.label}</Text>
                </View>
              );
            })
          )}
        </View>

        {action ? (
          <Pressable style={s.primary} onPress={() => void transition(action.next)}>
            <Text style={s.primaryText}>{action.label}</Text>
          </Pressable>
        ) : null}

        {allowed.includes('cancelled') ? (
          <Pressable style={s.danger} onPress={() => setCancelOpen(true)}>
            <Text style={s.primaryText}>رفض / إلغاء الطلب</Text>
          </Pressable>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={cancelOpen} transparent animationType="fade">
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.section}>إلغاء الطلب</Text>
            {CANCEL_REASONS.map((reason) => (
              <Pressable
                key={reason}
                style={[s.reason, cancelReasonPreset === reason && s.reasonOn]}
                onPress={() => setCancelReasonPreset(reason)}
              >
                <Text style={s.value}>{reason}</Text>
              </Pressable>
            ))}
            <Pressable
              style={[s.reason, cancelReasonPreset === '__custom__' && s.reasonOn]}
              onPress={() => setCancelReasonPreset('__custom__')}
            >
              <Text style={s.value}>سبب آخر</Text>
            </Pressable>
            {cancelReasonPreset === '__custom__' ? (
              <TextInput
                style={s.input}
                placeholder="اكتب السبب"
                placeholderTextColor="#94A3AC"
                value={cancelReasonCustom}
                onChangeText={setCancelReasonCustom}
                textAlign="right"
              />
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Pressable style={[s.mapBtn, { flex: 1 }]} onPress={() => setCancelOpen(false)}>
                <Text style={s.muted}>تراجع</Text>
              </Pressable>
              <Pressable
                style={[s.danger, { flex: 1, marginTop: 0 }]}
                onPress={() => {
                  const reason =
                    cancelReasonPreset === '__custom__' ? cancelReasonCustom.trim() : cancelReasonPreset;
                  if (!reason) {
                    Alert.alert('خطأ', 'يرجى تحديد سبب الإلغاء');
                    return;
                  }
                  setCancelOpen(false);
                  void transition('cancelled', reason);
                }}
              >
                <Text style={s.primaryText}>تأكيد</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B1622' },
  error: { color: '#94A3AC', textAlign: 'center', marginTop: 80 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#122532',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, color: '#F4F6F5', textAlign: 'right', writingDirection: 'rtl' },
  headerSub: { ...typography.caption, color: '#20B66F', textAlign: 'right', writingDirection: 'rtl' },
  scroll: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: '#101F2C',
    borderRadius: 14,
    padding: spacing.md,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150,175,185,0.18)',
  },
  section: { ...typography.caption, color: '#94A3AC', textAlign: 'right', writingDirection: 'rtl', fontWeight: '600' },
  value: { ...typography.body, color: '#F4F6F5', textAlign: 'right', writingDirection: 'rtl' },
  muted: { ...typography.caption, color: '#94A3AC', textAlign: 'right', writingDirection: 'rtl' },
  link: { ...typography.caption, color: '#20B66F', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  itemRow: { paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(150,175,185,0.12)' },
  itemName: { ...typography.bodyStrong, color: '#F4F6F5', textAlign: 'right', writingDirection: 'rtl' },
  mapBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#122532',
  },
  tlRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, justifyContent: 'flex-end' },
  tlDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#94A3AC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlDotDone: { backgroundColor: '#20B66F', borderColor: '#20B66F' },
  tlDotActive: { borderColor: '#20B66F', backgroundColor: '#18965B' },
  tlLabel: { flex: 1, ...typography.caption, color: '#94A3AC', textAlign: 'right', writingDirection: 'rtl' },
  tlDone: { color: '#F4F6F5' },
  tlActive: { color: '#20B66F', fontWeight: '700' },
  primary: {
    backgroundColor: '#20B66F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { ...typography.bodyStrong, color: '#F4F6F5' },
  danger: {
    marginTop: 8,
    backgroundColor: '#E85D5D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: spacing.lg },
  modalCard: {
    backgroundColor: '#101F2C',
    borderRadius: 16,
    padding: spacing.lg,
    gap: 8,
  },
  reason: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#122532',
  },
  reasonOn: { borderWidth: 1, borderColor: '#E85D5D' },
  input: {
    backgroundColor: '#122532',
    borderRadius: 12,
    padding: 10,
    color: '#F4F6F5',
  },
});
