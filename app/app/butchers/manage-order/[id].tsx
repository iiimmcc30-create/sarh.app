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
import { butcherTypography } from '@/constants/butcherTypography';
import { spacing, type ThemeColors } from '@/constants/theme';
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
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

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
        <RtlTextShell>
          <RtlText style={s.error}>تعذر تحميل تفاصيل الطلب</RtlText>
        </RtlTextShell>
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
        <RtlTextShell flex>
          <RtlText style={s.headerTitle}>{orderShortId(order)}</RtlText>
          <RtlText style={s.headerSub}>{opsStatusLabel(order.status, order.deliveryType)}</RtlText>
        </RtlTextShell>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <AppIcon name={rtlBackIcon()} size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.card}>
          <RtlTextShell>
            <RtlText style={s.section}>معلومات العميل</RtlText>
            <RtlText style={s.value}>{customer}</RtlText>
          </RtlTextShell>
          {phone ? (
            <Pressable onPress={() => void Linking.openURL(`tel:${phone}`)}>
              <CoverTrailRow justify="flex-end" gap={8}>
                <RtlTextShell flex>
                  <RtlText style={s.link}>{phone}</RtlText>
                </RtlTextShell>
                <AppIcon name="call-outline" size={16} color={colors.electric} />
              </CoverTrailRow>
            </Pressable>
          ) : null}
        </View>

        <View style={s.card}>
          <RtlTextShell>
            <RtlText style={s.section}>المنتجات</RtlText>
          </RtlTextShell>
          {items.map((item: any, idx: number) => (
            <View key={item.id || idx} style={s.itemRow}>
              <RtlTextShell>
                <RtlText style={s.itemName}>{item.product?.nameAr || 'منتج'}</RtlText>
                <RtlText style={s.muted}>
                  {item.cutType ? `${cutLabelAr(item.cutType)} · ` : ''}
                  {item.weightKg != null ? `${item.weightKg} كغ` : ''}
                </RtlText>
                <RtlText style={s.value}>
                  {Number(item.lineTotal ?? item.totalPrice ?? 0).toLocaleString()} {order.currency || 'ر.س'}
                </RtlText>
              </RtlTextShell>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <RtlTextShell>
            <RtlText style={s.section}>الدفع</RtlText>
            <RtlText style={s.value}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus as 'paid' | 'unpaid'] ?? order.paymentStatus}
            </RtlText>
            <RtlText style={s.muted}>الإجمالي {Number(order.totalPrice || 0).toLocaleString()} {order.currency || 'ر.س'}</RtlText>
          </RtlTextShell>
        </View>

        <View style={s.card}>
          <RtlTextShell>
            <RtlText style={s.section}>التوصيل</RtlText>
            <RtlText style={s.value}>{delivery ? 'توصيل الملحمة' : 'استلام من الملحمة'}</RtlText>
            <RtlText style={s.muted}>{address}</RtlText>
            {order.createdAt ? (
              <RtlText style={s.muted}>وقت الطلب: {new Date(order.createdAt).toLocaleString('ar-SA')}</RtlText>
            ) : null}
          </RtlTextShell>
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
            <RtlTextShell>
              <RtlText style={s.section}>ملاحظات العميل</RtlText>
              <RtlText style={s.value}>{order.notes}</RtlText>
            </RtlTextShell>
          </View>
        ) : null}

        <View style={s.card}>
          <RtlTextShell>
            <RtlText style={s.section}>متابعة الطلب</RtlText>
          </RtlTextShell>
          {order.status === 'cancelled' ? (
            <RtlTextShell>
              <RtlText style={[s.value, { color: colors.danger }]}>ملغى</RtlText>
            </RtlTextShell>
          ) : (
            flow.map((step) => {
              const done = flowStepDone(order.status, step.id, delivery);
              const active = flowStepActive(order.status, step.id, delivery);
              return (
                <View key={step.id} style={s.tlRow}>
                  <RtlTextShell flex>
                    <RtlText style={[s.tlLabel, done && s.tlDone, active && s.tlActive]}>{step.label}</RtlText>
                  </RtlTextShell>
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
            <RtlTextShell>
              <RtlText style={s.section}>إلغاء الطلب</RtlText>
            </RtlTextShell>
            {CANCEL_REASONS.map((reason) => (
              <Pressable
                key={reason}
                style={[s.reason, cancelReasonPreset === reason && s.reasonOn]}
                onPress={() => setCancelReasonPreset(reason)}
              >
                <RtlTextShell>
                  <RtlText style={s.value}>{reason}</RtlText>
                </RtlTextShell>
              </Pressable>
            ))}
            <Pressable
              style={[s.reason, cancelReasonPreset === '__custom__' && s.reasonOn]}
              onPress={() => setCancelReasonPreset('__custom__')}
            >
              <RtlTextShell>
                <RtlText style={s.value}>سبب آخر</RtlText>
              </RtlTextShell>
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
    ...butcherTypography.title,
    color: colors.textPrimary,
  },
  headerSub: {
    ...butcherTypography.secondary,
    color: colors.electric,
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
    ...butcherTypography.emphasis,
    color: colors.textMuted,
  },
  value: {
    ...butcherTypography.body,
    color: colors.textPrimary,
  },
  muted: {
    ...butcherTypography.secondary,
    color: colors.textMuted,
  },
  link: {
    ...butcherTypography.emphasis,
    color: colors.electric,
  },
  itemRow: { paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border },
  itemName: {
    ...butcherTypography.primary,
    color: colors.textPrimary,
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
    ...butcherTypography.secondary,
    color: colors.textMuted,
  },
  tlDone: { color: colors.textPrimary },
  tlActive: { ...butcherTypography.emphasis, color: colors.electric },
  primary: {
    backgroundColor: colors.electric,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    ...butcherTypography.primary,
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
