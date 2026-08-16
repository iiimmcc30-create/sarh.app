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
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow, rtlBackIcon } from '@/lib/rtl';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import { PAYMENT_STATUS_LABELS, cutLabelAr } from '@/services/butcherData';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import { safePush } from '@/lib/safeNavigate';
import {
  OPS_FLOW_DELIVERY,
  OPS_FLOW_PICKUP,
  formatOpsOrderDate,
  formatOpsOrderTime,
  flowStepActive,
  flowStepDone,
  isDeliveryOrder,
  mapsUrlForAddress,
  opsStatusAccent,
  opsStatusLabel,
  orderCustomerName,
  orderLineSummary,
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

  const openChat = () => {
    if (!order?.customer?.id) return;
    safePush('/butchers/chat', {
      receiverUserId: order.customer.id,
      receiverName: orderCustomerName(order),
      receiverAvatar: order.customer?.avatar || '',
      threadType: 'BUTCHER',
      ...(order.butcherId ? { butcherId: order.butcherId } : {}),
    }, router);
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
    : [order.butcher?.addressAr, order.butcher?.cityAr].filter(Boolean).join('، ') ||
      'استلام من الملحمة';
  const items =
    Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [
          {
            product: order.product,
            cutType: order.cutType,
            weightKg: order.weightKg,
            lineTotal: order.totalPrice,
          },
        ];
  const allowed: string[] = Array.isArray(order.allowedNextStatuses)
    ? order.allowedNextStatuses
    : [];
  const statusColor = opsStatusAccent(order, colors.textMuted);
  const paidLabel =
    PAYMENT_STATUS_LABELS[order.paymentStatus as 'paid' | 'unpaid'] ?? order.paymentStatus;
  const line = orderLineSummary(order);
  const total = `${Number(order.totalPrice || 0).toLocaleString('en-US')} ${
    order.currency === 'SAR' || !order.currency ? 'SAR' : order.currency
  }`;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={[s.header, getRtlRow()]}>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <AppIcon name={rtlBackIcon()} size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.headerBrand}>سرح</Text>
          <Text style={s.headerSub}>{orderShortId(order)}</Text>
        </View>
        <View style={s.iconBtnGhost} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <CoverTrailRow justify="space-between" gap={10}>
            <View style={s.statusBlock}>
              <View
                style={[
                  s.badge,
                  { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}55` },
                ]}
              >
                <Text style={[s.badgeText, { color: statusColor }]}>
                  {opsStatusLabel(order.status, order.deliveryType)}
                </Text>
              </View>
              {order.createdAt ? (
                <>
                  <View style={[s.metaTiny, getRtlRow()]}>
                    <AppIcon name="calendar-outline" size={12} color={colors.textMuted} />
                    <Text style={s.metaTinyText}>{formatOpsOrderDate(order.createdAt)}</Text>
                  </View>
                  <View style={[s.metaTiny, getRtlRow()]}>
                    <AppIcon name="time-outline" size={12} color={colors.textMuted} />
                    <Text style={s.metaTinyText}>{formatOpsOrderTime(order.createdAt)}</Text>
                  </View>
                </>
              ) : null}
            </View>
            <View style={s.customerBlock}>
              <View style={[s.customerRow, getRtlRow()]}>
                <View style={s.avatar}>
                  <AppIcon name="person-outline" size={18} color={colors.textMuted} />
                </View>
                <View style={s.customerText}>
                  <Text style={s.customer}>{customer}</Text>
                  <Text style={s.lines} numberOfLines={2}>
                    {line}
                  </Text>
                </View>
              </View>
              {phone ? (
                <Pressable onPress={() => void Linking.openURL(`tel:${phone}`)}>
                  <Text style={s.phone}>{phone}</Text>
                </Pressable>
              ) : null}
            </View>
          </CoverTrailRow>

          <View style={s.detailRow}>
            <View style={s.detailCol}>
              <AppIcon name="cube-outline" size={15} color={colors.textMuted} />
              <Text style={s.detailText}>{line}</Text>
            </View>
            <View style={s.detailCol}>
              <AppIcon
                name={delivery ? 'bicycle-outline' : 'storefront-outline'}
                size={15}
                color={colors.textMuted}
              />
              <Text style={s.detailText}>{delivery ? 'توصيل الملحمة' : 'استلام'}</Text>
              <Text style={s.detailSub}>{address}</Text>
            </View>
            <View style={s.detailCol}>
              <AppIcon
                name={order.paymentStatus === 'paid' ? 'checkmark-circle' : 'card-outline'}
                size={15}
                color={order.paymentStatus === 'paid' ? colors.electricBright : colors.textMuted}
              />
              <Text style={s.detailText}>{paidLabel}</Text>
              <Text style={s.detailPrice}>{total}</Text>
            </View>
          </View>

          <Pressable style={s.chatBtn} onPress={openChat}>
            <View style={[s.chatInner, getRtlRow()]}>
              <AppIcon name="chatbubble-outline" size={15} color={colors.electricBright} />
              <Text style={s.chatText}>محادثة العميل</Text>
            </View>
          </Pressable>
        </View>

        <View style={s.card}>
          <Text style={s.section}>المنتجات</Text>
          {items.map((item: any, idx: number) => (
            <View key={item.id || idx} style={s.itemRow}>
              <RtlTextShell>
                <RtlText style={s.itemName}>{item.product?.nameAr || 'منتج'}</RtlText>
                <RtlText style={s.muted}>
                  {item.cutType ? `${cutLabelAr(item.cutType)} · ` : ''}
                  {item.weightKg != null ? `${item.weightKg} كغ` : ''}
                </RtlText>
                <RtlText style={s.value}>
                  {Number(item.lineTotal ?? item.totalPrice ?? 0).toLocaleString('en-US')}{' '}
                  {order.currency || 'ر.س'}
                </RtlText>
              </RtlTextShell>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.section}>التوصيل</Text>
          <Text style={s.value}>{delivery ? 'توصيل الملحمة' : 'استلام من الملحمة'}</Text>
          <Text style={s.muted}>{address}</Text>
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
            <Text style={s.section}>ملاحظات العميل</Text>
            <Text style={s.value}>{order.notes}</Text>
          </View>
        ) : null}

        <View style={s.card}>
          <Text style={s.section}>متابعة الطلب</Text>
          {order.status === 'cancelled' ? (
            <Text style={[s.value, { color: colors.danger }]}>ملغى</Text>
          ) : (
            flow.map((step) => {
              const done = flowStepDone(order.status, step.id, delivery);
              const active = flowStepActive(order.status, step.id, delivery);
              return (
                <View key={step.id} style={s.tlRow}>
                  <RtlTextShell flex>
                    <RtlText style={[s.tlLabel, done && s.tlDone, active && s.tlActive]}>
                      {step.label}
                    </RtlText>
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
                    cancelReasonPreset === '__custom__'
                      ? cancelReasonCustom.trim()
                      : cancelReasonPreset;
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
  const cardBg = scheme === 'light' ? '#FFFFFF' : colors.bgElevated;
  const pageBg = scheme === 'light' ? '#F2F4F6' : colors.screenRoot;
  const border = colors.borderSoft;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: pageBg },
    error: {
      color: colors.textMuted,
      marginTop: 80,
      paddingHorizontal: spacing.lg,
      fontFamily: OFFICIAL_APP_FONT,
    },
    header: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: 10,
    },
    headerText: { flex: 1, minWidth: 0, alignItems: 'flex-end' },
    headerBrand: {
      ...typography.h3,
      fontFamily: OFFICIAL_APP_FONT,
      fontSize: 22,
      lineHeight: 30,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    headerSub: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
    },
    iconBtnGhost: { width: 36, height: 36 },
    scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
    heroCard: {
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: spacing.md,
      gap: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      marginBottom: spacing.md,
    },
    statusBlock: { alignItems: 'flex-start', gap: 4, maxWidth: '42%' },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      alignSelf: 'flex-start',
    },
    badgeText: {
      ...typography.badge,
      fontFamily: OFFICIAL_APP_FONT,
      includeFontPadding: false,
    },
    metaTiny: { alignItems: 'center', gap: 4 },
    metaTinyText: {
      ...typography.micro,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    customerBlock: { flex: 1, minWidth: 0, alignItems: 'flex-end', gap: 6 },
    customerRow: { alignItems: 'center', gap: 8, maxWidth: '100%' },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    customerText: { flex: 1, minWidth: 0, alignItems: 'flex-end' },
    customer: {
      ...typography.bodyStrong,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      width: '100%',
      includeFontPadding: false,
    },
    lines: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
      width: '100%',
      includeFontPadding: false,
      marginTop: 2,
    },
    phone: {
      ...typography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.electricBright,
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    detailRow: {
      flexDirection: 'row-reverse',
      gap: 8,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: border,
    },
    detailCol: { flex: 1, alignItems: 'flex-end', gap: 4, minWidth: 0 },
    detailText: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      width: '100%',
      includeFontPadding: false,
    },
    detailSub: {
      ...typography.micro,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
      width: '100%',
      includeFontPadding: false,
    },
    detailPrice: {
      ...typography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      width: '100%',
      includeFontPadding: false,
    },
    chatBtn: {
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.electricBright,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatInner: { alignItems: 'center', gap: 6 },
    chatText: {
      ...typography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.electricBright,
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    card: {
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: spacing.md,
      marginBottom: spacing.sm,
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
    },
    section: {
      ...typography.bodyStrong,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    value: {
      ...typography.body,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    muted: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    itemRow: {
      paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: border,
    },
    itemName: {
      ...typography.bodyStrong,
      fontFamily: OFFICIAL_APP_FONT,
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
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      paddingHorizontal: 12,
    },
    link: {
      ...typography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.electric,
    },
    tlRow: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
    },
    tlLabel: {
      ...typography.secondary,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
    },
    tlDone: { color: colors.textPrimary },
    tlActive: { color: colors.electricBright },
    tlDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tlDotDone: { backgroundColor: colors.electricBright, borderColor: colors.electricBright },
    tlDotActive: { borderColor: colors.electricBright },
    primary: {
      backgroundColor: colors.electricBright,
      borderRadius: 14,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    primaryText: {
      ...typography.bodyStrong,
      fontFamily: OFFICIAL_APP_FONT,
      color: '#fff',
      includeFontPadding: false,
    },
    danger: {
      backgroundColor: colors.danger,
      borderRadius: 14,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: spacing.lg,
      gap: 8,
    },
    reason: {
      padding: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
    },
    reasonOn: {
      borderColor: colors.electricBright,
      backgroundColor: `${colors.electricBright}14`,
    },
    input: {
      borderWidth: 1,
      borderColor: border,
      borderRadius: 12,
      padding: spacing.md,
      color: colors.textPrimary,
      fontFamily: OFFICIAL_APP_FONT,
      textAlign: 'right',
    },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
  });
}
