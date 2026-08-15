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
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
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
  const { colors } = useTheme();
  const s = useThemedStyles(({ colors, scheme }) => createStyles(colors, scheme));
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
        <ActivityIndicator size="large" color={colors.electric} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.rtlTextShell}>
          <Text style={s.error}>تعذر تحميل تفاصيل الطلب</Text>
        </View>
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
        <View style={s.rtlTextShellFlex}>
          <Text style={s.headerTitle}>{orderShortId(order)}</Text>
          <Text style={s.headerSub}>{opsStatusLabel(order.status, order.deliveryType)}</Text>
        </View>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <AppIcon name={rtlBackIcon()} size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.card}>
          <View style={s.rtlTextShell}>
            <Text style={s.section}>معلومات العميل</Text>
            <Text style={s.value}>{customer}</Text>
          </View>
          {phone ? (
            <Pressable onPress={() => void Linking.openURL(`tel:${phone}`)} style={s.coverTrail}>
              <View style={s.rtlTextShellFlex}>
                <Text style={s.link}>{phone}</Text>
              </View>
              <AppIcon name="call-outline" size={16} color={colors.electric} />
            </Pressable>
          ) : null}
        </View>

        <View style={s.card}>
          <View style={s.rtlTextShell}>
            <Text style={s.section}>المنتجات</Text>
          </View>
          {items.map((item: any, idx: number) => (
            <View key={item.id || idx} style={s.itemRow}>
              <View style={s.rtlTextShell}>
                <Text style={s.itemName}>{item.product?.nameAr || 'منتج'}</Text>
                <Text style={s.muted}>
                  {item.cutType ? `${cutLabelAr(item.cutType)} · ` : ''}
                  {item.weightKg != null ? `${item.weightKg} كغ` : ''}
                </Text>
                <Text style={s.value}>
                  {Number(item.lineTotal ?? item.totalPrice ?? 0).toLocaleString()} {order.currency || 'ر.س'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <View style={s.rtlTextShell}>
            <Text style={s.section}>الدفع</Text>
            <Text style={s.value}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus as 'paid' | 'unpaid'] ?? order.paymentStatus}
            </Text>
            <Text style={s.muted}>الإجمالي {Number(order.totalPrice || 0).toLocaleString()} {order.currency || 'ر.س'}</Text>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.rtlTextShell}>
            <Text style={s.section}>التوصيل</Text>
            <Text style={s.value}>{delivery ? 'توصيل الملحمة' : 'استلام من الملحمة'}</Text>
            <Text style={s.muted}>{address}</Text>
            {order.createdAt ? (
              <Text style={s.muted}>وقت الطلب: {new Date(order.createdAt).toLocaleString('ar-SA')}</Text>
            ) : null}
          </View>
          {delivery && order.deliveryAddress ? (
            <Pressable
              style={s.mapBtn}
              onPress={() => void Linking.openURL(mapsUrlForAddress(String(order.deliveryAddress)))}
            >
              <Text style={s.link}>فتح الموقع</Text>
              <AppIcon name="navigate-outline" size={16} color={colors.electric} />
            </Pressable>
          ) : null}
        </View>

        {order.notes ? (
          <View style={s.card}>
            <View style={s.rtlTextShell}>
              <Text style={s.section}>ملاحظات العميل</Text>
              <Text style={s.value}>{order.notes}</Text>
            </View>
          </View>
        ) : null}

        <View style={s.card}>
          <View style={s.rtlTextShell}>
            <Text style={s.section}>متابعة الطلب</Text>
          </View>
          {order.status === 'cancelled' ? (
            <View style={s.rtlTextShell}>
              <Text style={[s.value, { color: colors.danger }]}>ملغى</Text>
            </View>
          ) : (
            flow.map((step) => {
              const done = flowStepDone(order.status, step.id, delivery);
              const active = flowStepActive(order.status, step.id, delivery);
              return (
                <View key={step.id} style={s.tlRow}>
                  <View style={s.rtlTextShellFlex}>
                    <Text style={[s.tlLabel, done && s.tlDone, active && s.tlActive]}>{step.label}</Text>
                  </View>
                  <View style={[s.tlDot, done && s.tlDotDone, active && s.tlDotActive]}>
                    {done ? <AppIcon name="checkmark" size={10} color="#fff" /> : null}
                  </View>
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
            <View style={s.rtlTextShell}>
              <Text style={s.section}>إلغاء الطلب</Text>
            </View>
            {CANCEL_REASONS.map((reason) => (
              <Pressable
                key={reason}
                style={[s.reason, cancelReasonPreset === reason && s.reasonOn]}
                onPress={() => setCancelReasonPreset(reason)}
              >
                <View style={s.rtlTextShell}>
                  <Text style={s.value}>{reason}</Text>
                </View>
              </Pressable>
            ))}
            <Pressable
              style={[s.reason, cancelReasonPreset === '__custom__' && s.reasonOn]}
              onPress={() => setCancelReasonPreset('__custom__')}
            >
              <View style={s.rtlTextShell}>
                <Text style={s.value}>سبب آخر</Text>
              </View>
            </Pressable>
            {cancelReasonPreset === '__custom__' ? (
              <TextInput
                style={s.input}
                placeholder="اكتب السبب"
                placeholderTextColor={colors.textMuted}
                value={cancelReasonCustom}
                onChangeText={setCancelReasonCustom}
                textAlign="right"
              />
            ) : null}
            <View style={s.modalActions}>
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

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const cardBg = colors.bgElevated;
  const softBg = scheme === 'light' ? colors.bgDeep : colors.bgSurface;
  const border = colors.borderSoft;
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenRoot },
  error: {
    color: colors.textMuted,
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 80,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    direction: 'ltr',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 10,
  },
  rtlTextShell: { width: '100%', direction: 'ltr' },
  rtlTextShellFlex: { flex: 1, minWidth: 0, direction: 'ltr' },
  coverTrail: {
    flexDirection: 'row',
    direction: 'ltr',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: softBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerSub: {
    ...typography.caption,
    color: colors.electric,
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  scroll: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: cardBg,
    borderRadius: 14,
    padding: spacing.md,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: border,
  },
  section: {
    ...typography.caption,
    color: colors.textMuted,
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '600',
  },
  value: {
    ...typography.body,
    color: colors.textPrimary,
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  muted: {
    ...typography.caption,
    color: colors.textMuted,
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  link: {
    ...typography.caption,
    color: colors.electric,
    fontWeight: '600',
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  itemRow: { paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border },
  itemName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  mapBtn: {
    marginTop: 8,
    flexDirection: 'row',
    direction: 'ltr',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: softBg,
  },
  tlRow: {
    flexDirection: 'row',
    direction: 'ltr',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  tlDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlDotDone: { backgroundColor: colors.electric, borderColor: colors.electric },
  tlDotActive: { borderColor: colors.electric, backgroundColor: colors.electric },
  tlLabel: {
    ...typography.caption,
    color: colors.textMuted,
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tlDone: { color: colors.textPrimary },
  tlActive: { color: colors.electric, fontWeight: '700' },
  primary: {
    backgroundColor: colors.electric,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    ...typography.bodyStrong,
    color: '#fff',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  modalActions: {
    flexDirection: 'row',
    direction: 'ltr',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  danger: {
    marginTop: 8,
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: spacing.lg },
  modalCard: {
    backgroundColor: cardBg,
    borderRadius: 16,
    padding: spacing.lg,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: border,
  },
  reason: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: softBg,
  },
  reasonOn: { borderWidth: 1, borderColor: colors.danger },
  input: {
    backgroundColor: softBg,
    borderRadius: 12,
    padding: 10,
    color: colors.textPrimary,
  },
});
}
