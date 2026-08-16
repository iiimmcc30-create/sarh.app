import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
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
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
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
  formatOrderDateTime,
  formatSar,
  isDeliveryOrder,
  mapsUrlForAddress,
  opsStatusLabel,
  opsStatusTone,
  OPS_TONE_COLORS,
  orderCustomerName,
  orderShortId,
  paymentMethodLabel,
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
  const [showMore, setShowMore] = useState(false);
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
  const items =
    Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [{ product: order.product, cutType: order.cutType, weightKg: order.weightKg, lineTotal: order.totalPrice }];
  const allowed: string[] = Array.isArray(order.allowedNextStatuses) ? order.allowedNextStatuses : [];
  const tone = opsStatusTone(order);
  const accent = OPS_TONE_COLORS[tone];
  const paid = order.paymentStatus === 'paid';
  const currency = order.currency || 'ر.س';

  const openChat = () => {
    if (!order.customer?.id) return;
    router.push({
      pathname: '/butchers/chat',
      params: {
        receiverId: order.customer.id,
        receiverName: customer,
        receiverAvatar: order.customer?.avatar || '',
        threadType: 'BUTCHER',
        ...(order.butcher?.id ? { butcherId: order.butcher.id } : {}),
      },
    });
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <View style={s.nav}>
        <View style={{ width: 40 }} />
        <Text style={s.navTitle}>تفاصيل الطلب</Text>
        <Pressable onPress={() => router.back()} style={s.iconBtn}>
          <AppIcon name={rtlBackIcon()} size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.sheet}>
          <View style={s.sheetHead}>
            <View style={s.priceCol}>
              <Text style={s.price}>{formatSar(order.totalPrice, currency)}</Text>
              <View style={[s.paidBadge, { backgroundColor: `${accent}22` }]}>
                <AppIcon name="checkmark" size={11} color={accent} />
                <Text style={[s.paidBadgeText, { color: accent }]}>
                  {PAYMENT_STATUS_LABELS[order.paymentStatus as 'paid' | 'unpaid'] ?? (paid ? 'مدفوع' : 'غير مدفوع')}
                </Text>
              </View>
            </View>
            <View style={s.headMain}>
              <View style={[s.statusBadge, { backgroundColor: accent }]}>
                <View style={s.statusDot} />
                <Text style={s.statusBadgeText}>{opsStatusLabel(order.status, order.deliveryType)}</Text>
              </View>
              <Text style={s.orderId}>{orderShortId(order)}</Text>
              {order.createdAt ? <Text style={s.dateText}>{formatOrderDateTime(order.createdAt)}</Text> : null}
            </View>
          </View>

          <View style={s.block}>
            <View style={s.blockTitleRow}>
              <Text style={s.blockTitle}>معلومات العميل</Text>
              <AppIcon name="person-outline" size={16} color={accent} />
            </View>
            <View style={s.customerRow}>
              {phone ? (
                <Pressable onPress={() => void Linking.openURL(`tel:${phone}`)} style={s.callBtn}>
                  <AppIcon name="call-outline" size={18} color="#fff" />
                </Pressable>
              ) : (
                <View style={{ width: 42 }} />
              )}
              <View style={s.customerText}>
                <Text style={s.value}>{customer}</Text>
                {phone ? <Text style={s.muted}>{phone}</Text> : null}
                <View style={s.locLine}>
                  <AppIcon name="map-marker-outline" size={13} color={accent} />
                  <Text style={s.muted} numberOfLines={2}>
                    {address}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={s.block}>
            <View style={s.blockTitleRow}>
              <Text style={s.blockTitle}>معلومات الطلب</Text>
              <AppIcon name="clipboard-outline" size={16} color={accent} />
            </View>
            <InfoRow icon="truck" label="نوع الطلب" value={delivery ? 'توصيل' : 'استلام'} colors={colors} />
            <InfoRow
              icon="time-outline"
              label="وقت التسليم"
              value={formatOrderDateTime(order.scheduledAt || order.createdAt) || '—'}
              colors={colors}
            />
            <InfoRow icon="credit-card-outline" label="طريقة الدفع" value={paymentMethodLabel(order)} colors={colors} />
            <InfoRow icon="copy-outline" label="رقم الطلب" value={orderShortId(order)} colors={colors} />

            {items.map((item: any, idx: number) => {
              const name = item.product?.nameAr || 'منتج';
              const weight = item.weightKg != null ? `${item.weightKg} كجم` : '';
              const unit = item.unitPrice ?? item.product?.pricePerKg;
              const line = Number(item.lineTotal ?? item.totalPrice ?? 0);
              const thumb = item.product?.images?.[0];
              return (
                <View key={item.id || idx} style={s.itemRow}>
                  <View style={s.itemMeta}>
                    <Text style={s.itemTotal}>{formatSar(line, currency)}</Text>
                    <Text style={s.itemQty}>
                      {weight}
                      {unit != null ? ` × ${formatSar(unit, currency)}` : ''}
                    </Text>
                    <Text style={s.itemPiece}>{item.quantity != null ? `${item.quantity} قطعة` : '1 قطعة'}</Text>
                  </View>
                  <View style={s.itemMain}>
                    <Text style={s.itemName}>{name}</Text>
                    {item.cutType ? <Text style={s.muted}>{cutLabelAr(item.cutType)}</Text> : null}
                  </View>
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={s.thumb} contentFit="cover" />
                  ) : (
                    <View style={[s.thumb, s.thumbEmpty]}>
                      <AppIcon name="image-outline" size={16} color={colors.textMuted} />
                    </View>
                  )}
                </View>
              );
            })}

            <View style={s.totalRow}>
              <Text style={[s.totalValue, { color: accent }]}>{formatSar(order.totalPrice, currency)}</Text>
              <Text style={s.totalLabel}>المجموع</Text>
            </View>
          </View>

          {showMore ? (
            <>
              {order.notes ? (
                <View style={s.block}>
                  <Text style={s.blockTitle}>ملاحظات العميل</Text>
                  <Text style={s.value}>{order.notes}</Text>
                </View>
              ) : null}
              <View style={s.block}>
                <Text style={s.blockTitle}>متابعة الطلب</Text>
                {order.status === 'cancelled' ? (
                  <Text style={[s.value, { color: colors.danger }]}>ملغى</Text>
                ) : (
                  flow.map((step) => {
                    const done = flowStepDone(order.status, step.id, delivery);
                    const active = flowStepActive(order.status, step.id, delivery);
                    return (
                      <View key={step.id} style={s.tlRow}>
                        <Text style={[s.tlLabel, done && s.tlDone, active && s.tlActive]}>{step.label}</Text>
                        <View style={[s.tlDot, done && s.tlDotDone, active && s.tlDotActive]}>
                          {done ? <AppIcon name="checkmark" size={10} color="#fff" /> : null}
                        </View>
                      </View>
                    );
                  })
                )}
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
            </>
          ) : null}

          <View style={s.footerBtns}>
            <Pressable style={s.ghostBtn} onPress={() => setShowMore((v) => !v)}>
              <AppIcon name={showMore ? 'angle-up' : 'angle-down'} size={16} color={colors.textPrimary} />
              <Text style={s.ghostText}>{showMore ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</Text>
            </Pressable>
            <Pressable style={[s.chatBtn, { backgroundColor: accent }]} onPress={openChat}>
              <AppIcon name="chatbubble-outline" size={16} color="#fff" />
              <Text style={s.chatText}>التواصل مع العميل</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal visible={cancelOpen} transparent animationType="fade">
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.blockTitle}>إلغاء الطلب</Text>
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

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ThemeColors;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text
        style={{
          ...butcherTypography.body,
          fontFamily: OFFICIAL_APP_FONT,
          color: colors.textPrimary,
          flex: 1,
          textAlign: 'left',
        }}
      >
        {value}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ ...butcherTypography.meta, fontFamily: OFFICIAL_APP_FONT, color: colors.textMuted }}>
          {label}
        </Text>
        <AppIcon name={icon} size={14} color={colors.electricBright} />
      </View>
    </View>
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
      textAlign: 'center',
      fontFamily: OFFICIAL_APP_FONT,
    },
    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: 8,
    },
    navTitle: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
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
    scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, paddingTop: 4 },
    sheet: {
      backgroundColor: cardBg,
      borderRadius: 18,
      padding: spacing.md,
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
    },
    sheetHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
    },
    priceCol: { alignItems: 'flex-start', gap: 6 },
    price: {
      ...butcherTypography.title,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
    },
    paidBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    paidBadgeText: { ...butcherTypography.badge, fontFamily: OFFICIAL_APP_FONT },
    headMain: { flex: 1, alignItems: 'flex-end', gap: 4 },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
    statusBadgeText: { ...butcherTypography.badge, fontFamily: OFFICIAL_APP_FONT, color: '#fff' },
    orderId: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
    },
    dateText: {
      ...butcherTypography.meta,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
    },
    block: {
      backgroundColor: softBg,
      borderRadius: 14,
      padding: spacing.md,
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
    },
    blockTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      marginBottom: 4,
    },
    blockTitle: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
    },
    customerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    callBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.electricBright,
      alignItems: 'center',
      justifyContent: 'center',
    },
    customerText: { flex: 1, alignItems: 'flex-end', gap: 2 },
    value: {
      ...butcherTypography.body,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    muted: {
      ...butcherTypography.secondary,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    locLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: border,
    },
    itemMeta: { alignItems: 'flex-start', minWidth: 88 },
    itemTotal: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
    },
    itemQty: {
      ...butcherTypography.meta,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
    },
    itemPiece: {
      ...butcherTypography.meta,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textSecondary,
    },
    itemMain: { flex: 1, alignItems: 'flex-end' },
    itemName: {
      ...butcherTypography.primary,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    thumb: { width: 48, height: 48, borderRadius: 10 },
    thumbEmpty: {
      backgroundColor: colors.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: border,
    },
    totalLabel: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
    },
    totalValue: {
      ...butcherTypography.title,
      fontFamily: OFFICIAL_APP_FONT,
    },
    footerBtns: {
      flexDirection: 'row',
      gap: 8,
    },
    ghostBtn: {
      flex: 1,
      minHeight: 46,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    ghostText: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
    },
    chatBtn: {
      flex: 1,
      minHeight: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    chatText: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: '#fff',
    },
    link: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.electric,
    },
    mapBtn: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.bgSurface,
    },
    tlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
      paddingVertical: 4,
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
      fontFamily: OFFICIAL_APP_FONT,
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
      fontFamily: OFFICIAL_APP_FONT,
      color: '#fff',
      textAlign: 'center',
    },
    modalActions: {
      flexDirection: 'row',
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
      fontFamily: OFFICIAL_APP_FONT,
    },
  });
}
