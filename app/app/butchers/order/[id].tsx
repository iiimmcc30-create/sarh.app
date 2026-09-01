import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { butcherTypography } from '@/constants/butcherTypography';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  CUSTOMER_FLOW_LABELS,
  CUSTOMER_ORDER_FLOW,
  customerOrderHeadline,
  firstProductImage,
  flowReached,
  formatOrderStamp,
  isPayableButcherOrder,
  orderLineItems,
  orderMoneySummary,
  timelineStamp,
} from '@/lib/customerOrders';
import { rtlBackIcon } from '@/lib/rtl';
import { API_BASE } from '@/services/api';
import { ORDER_STATUS_COLORS } from '@/services/butcherData';
import {
  completeButcherOrderPayment,
  formatCurrency,
  type ButcherOrderRecord,
} from '@/services/butcherOrders';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const s = useThemedStyles(({ colors }) => createStyles(colors));
  const [order, setOrder] = useState<ButcherOrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id || !accessToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/butchers/orders/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: ButcherOrderRecord;
      };
      if (res.ok && json.success && json.data) setOrder(json.data);
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
      <SafeAreaView style={s.screen} edges={['top']}>
        <ActivityIndicator size="large" color={colors.electricBright} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.errorText}>تعذر تحميل تفاصيل الطلب</Text>
      </SafeAreaView>
    );
  }

  const statusColor = ORDER_STATUS_COLORS[order.status] ?? colors.textMuted;
  const headline = customerOrderHeadline(order);
  const statusText = headline.label;
  const canPay = isPayableButcherOrder(order) && Boolean(accessToken);
  const isPickup = order.deliveryType !== 'delivery';
  const customerName = order.customer?.arabicName || order.customer?.displayName || 'عميل سرح';
  const customerPhone = order.customer?.phone as string | undefined;
  const butcherPhone = order.butcher?.phone as string | undefined;
  const deliveryLabel = isPickup ? 'استلام' : 'توصيل';
  const locationValue = isPickup
    ? [order.butcher?.addressAr, order.butcher?.cityAr]
        .map((p: unknown) => (typeof p === 'string' ? p.trim() : ''))
        .filter(Boolean)
        .join('، ')
    : order.deliveryAddress;
  const locationLabel = isPickup ? 'موقع الملحمة' : 'موقع التوصيل';
  const lines = orderLineItems(order);
  const money = orderMoneySummary(order);
  const reached = flowReached(order);
  const delivered = order.status === 'delivered';

  const handleCompletePayment = async () => {
    if (!accessToken || paying) return;
    setPaying(true);
    try {
      const outcome = await completeButcherOrderPayment({ accessToken, order });
      if (outcome === 'blocked') {
        await loadOrder();
        return;
      }
      if (outcome === 'cancelled' || outcome === 'failed') {
        await loadOrder();
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <CoverTrailRow justify="space-between" style={s.navRow}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ width: 40 }} />
      </CoverTrailRow>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <CoverTrailRow justify="space-between" gap={spacing.md} style={s.headerRow}>
          <View
            style={[
              s.statusBadge,
              delivered
                ? { backgroundColor: colors.success, borderColor: colors.success }
                : { backgroundColor: statusColor + '22', borderColor: statusColor + '55' },
            ]}
          >
            {delivered ? <AppIcon name="checkmark" size={13} color="#fff" /> : null}
            <Text style={[s.statusBadgeText, { color: delivered ? '#fff' : statusColor }]}>
              {statusText}
            </Text>
          </View>
          <RtlTextShell flex>
            <RtlText style={s.orderNumber} numberOfLines={1}>
              {order.orderNumber}
            </RtlText>
            <RtlText style={s.orderStamp}>{formatOrderStamp(order.createdAt)}</RtlText>
          </RtlTextShell>
        </CoverTrailRow>

        {headline.awaitingPayment ? (
          <View style={s.card}>
            <RtlTextShell>
              <RtlText style={s.sectionTitle}>لم يكتمل الدفع</RtlText>
              <RtlText style={s.payHint}>
                يمكنك إكمال الدفع لهذا الطلب دون إنشاء طلب جديد. الملحمة لا تقبل الطلب قبل السداد.
              </RtlText>
            </RtlTextShell>
            <Pressable
              style={({ pressed }) => [s.payBtn, (pressed || paying) && { opacity: 0.88 }]}
              onPress={() => void handleCompletePayment()}
              disabled={paying || !canPay}
            >
              {paying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.payBtnText}>إكمال الدفع</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {headline.expired ? (
          <View style={s.card}>
            <RtlTextShell>
              <RtlText style={s.sectionTitle}>انتهت صلاحية الطلب</RtlText>
              <RtlText style={s.payHint}>
                انتهت مهلة الدفع وتم تحرير الكمية. يمكنك إنشاء طلب جديد من الملحمة.
              </RtlText>
            </RtlTextShell>
          </View>
        ) : null}

        <View style={s.card}>
          <RtlTextShell>
            <RtlText style={s.sectionTitle}>متابعة الطلب</RtlText>
          </RtlTextShell>
          {order.status === 'cancelled' ? (
            <RtlTextShell>
              <RtlText style={s.cancelNote}>
                {order.cancellationReason ? `ملغي · ${order.cancellationReason}` : 'تم إلغاء هذا الطلب'}
              </RtlText>
            </RtlTextShell>
          ) : (
            <View style={s.trackRow}>
              {CUSTOMER_ORDER_FLOW.map((step, index) => {
                const done = reached.has(step);
                const time = timelineStamp(order.timeline, step, order.createdAt);
                return (
                  <View key={step} style={s.trackStep}>
                    {index > 0 ? (
                      <View
                        style={[
                          s.trackLine,
                          { backgroundColor: done ? colors.success : colors.borderSoft },
                        ]}
                      />
                    ) : null}
                    <View
                      style={[
                        s.trackDot,
                        {
                          backgroundColor: done ? colors.success : colors.bgElevated,
                          borderColor: done ? colors.success : colors.borderMid,
                        },
                      ]}
                    >
                      {done ? <AppIcon name="checkmark" size={11} color="#fff" /> : null}
                    </View>
                    <Text style={[s.trackLabel, done && { color: colors.textPrimary }]}>
                      {CUSTOMER_FLOW_LABELS[step]}
                    </Text>
                    {time ? <Text style={s.trackTime}>{time}</Text> : <Text style={s.trackTime}> </Text>}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={s.card}>
          <SectionHead icon="person-outline" title="العميل والاستلام" colors={colors} styles={s} />
          <InfoRow styles={s} label="العميل" value={customerName} />
          {customerPhone ? (
            <Pressable onPress={() => void Linking.openURL(`tel:${customerPhone}`)}>
              <InfoRow styles={s} label="الجوال" value={customerPhone} valueColor={colors.electricBright} />
            </Pressable>
          ) : null}
          <InfoRow
            styles={s}
            label="طريقة الاستلام"
            value={deliveryLabel}
            icon={isPickup ? 'storefront-outline' : 'truck'}
            iconColor={colors.success}
          />
          {locationValue ? (
            <InfoRow
              styles={s}
              label={locationLabel}
              value={locationValue}
              icon="location-outline"
              iconColor={colors.success}
            />
          ) : null}
        </View>

        <View style={s.card}>
          <SectionHead icon="cart-outline" title="تفاصيل الطلب" colors={colors} styles={s} />
          {lines.map((item) => {
            const thumb = uriSource(item.image ?? firstProductImage(order));
            return (
              <CoverTrailRow key={item.id} justify="space-between" gap={spacing.sm} style={s.itemRow}>
                <View style={s.itemPriceCol}>
                  <Text style={s.itemLinePrice}>
                    {formatCurrency(item.linePrice, order.currency)}
                  </Text>
                  <Text style={s.itemQty}>{item.quantity} قطعة</Text>
                </View>
                <RtlTextShell flex>
                  <RtlText style={s.itemName} numberOfLines={1}>
                    {item.name}
                  </RtlText>
                  <RtlText style={s.itemMeta} numberOfLines={2}>
                    {item.weightKg > 0
                      ? `${item.weightKg} كجم × ${formatCurrency(item.unitPrice, order.currency)}`
                      : item.cutLabel}
                  </RtlText>
                </RtlTextShell>
                <View style={s.thumb}>
                  {thumb ? (
                    <Image source={thumb} style={s.thumbImg} contentFit="cover" />
                  ) : (
                    <AppIcon name="cart-outline" size={18} color={colors.textMuted} />
                  )}
                </View>
              </CoverTrailRow>
            );
          })}

          <View style={s.summaryBlock}>
            <InfoRow
              styles={s}
              label="المجموع الفرعي"
              value={formatCurrency(money.subtotal, order.currency)}
            />
            <InfoRow
              styles={s}
              label="رسوم التوصيل"
              value={
                money.deliveryFee == null
                  ? '—'
                  : formatCurrency(money.deliveryFee, order.currency)
              }
            />
            <InfoRow
              styles={s}
              label="الإجمالي"
              value={formatCurrency(money.total, order.currency)}
              valueColor={colors.success}
              strong
            />
            <Text style={s.vatNote}>شامل الضريبة</Text>
          </View>
          {order.notes ? <InfoRow styles={s} label="ملاحظات" value={order.notes} /> : null}
        </View>

        <CoverTrailRow justify="space-between" gap={spacing.sm} style={s.footerRow}>
          <Pressable
            style={({ pressed }) => [s.footerCard, pressed && { opacity: 0.9 }]}
            onPress={() =>
              router.push(
                {
                  pathname: '/support/help',
                  params: order.paymentStatus === 'paid' ? { orderId: order.id } : {},
                } as never,
              )
            }
          >
            <AppIcon name="headset" size={20} color={colors.electricBright} />
            <Text style={s.footerTitle}>المساعدة</Text>
            <Text style={s.footerSub}>سرحان وخدمة العملاء — بدون تواصل مع الملحمة</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.footerCard, pressed && { opacity: 0.9 }]}
            onPress={() => {
              if (butcherPhone) void Linking.openURL(`tel:${butcherPhone}`);
            }}
          >
            <AppIcon name="call-outline" size={20} color={colors.electricBright} />
            <Text style={s.footerTitle}>اتصل بالملحمة</Text>
            <Text style={s.footerSub}>{butcherPhone || 'الرقم غير متوفر'}</Text>
          </Pressable>
        </CoverTrailRow>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHead({
  icon,
  title,
  colors,
  styles,
}: {
  icon: string;
  title: string;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <CoverTrailRow justify="flex-end" gap={8} style={styles.sectionHead}>
      <RtlTextShell>
        <RtlText style={styles.sectionTitle}>{title}</RtlText>
      </RtlTextShell>
      <AppIcon name={icon} size={16} color={colors.success} />
    </CoverTrailRow>
  );
}

function InfoRow({
  styles,
  label,
  value,
  icon,
  iconColor,
  valueColor,
  strong,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
  value: string;
  icon?: string;
  iconColor?: string;
  valueColor?: string;
  strong?: boolean;
}) {
  return (
    <CoverTrailRow justify="space-between" gap={spacing.md} style={styles.infoRow}>
      <CoverTrailRow gap={6} style={styles.infoValueWrap}>
        {icon ? <AppIcon name={icon} size={14} color={iconColor} /> : null}
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null, strong && styles.infoValueStrong]}>
          {value}
        </Text>
      </CoverTrailRow>
      <Text style={styles.infoLabel}>{label}</Text>
    </CoverTrailRow>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    navRow: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgGlass,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
    headerRow: { alignItems: 'flex-start' },
    orderNumber: {
      ...butcherTypography.titleLarge,
      color: colors.textPrimary,
    },
    orderStamp: {
      ...butcherTypography.meta,
      color: colors.textMuted,
      marginTop: 4,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      flexShrink: 0,
    },
    statusBadgeText: { ...butcherTypography.emphasis, writingDirection: 'rtl' },
    card: {
      backgroundColor: colors.bgSurface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    sectionHead: { marginBottom: 4 },
    sectionTitle: {
      ...butcherTypography.title,
      color: colors.textPrimary,
    },
    cancelNote: {
      ...butcherTypography.secondary,
      color: colors.danger,
    },
    payHint: {
      ...butcherTypography.secondary,
      color: colors.textMuted,
      marginTop: 4,
    },
    payBtn: {
      marginTop: spacing.sm,
      backgroundColor: colors.electricBright,
      borderRadius: 14,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    payBtnText: {
      ...butcherTypography.emphasis,
      color: '#fff',
      writingDirection: 'rtl',
    },
    trackRow: {
      flexDirection: 'row-reverse',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingTop: spacing.sm,
    },
    trackStep: {
      flex: 1,
      alignItems: 'center',
      position: 'relative',
      minWidth: 0,
    },
    trackLine: {
      position: 'absolute',
      top: 10,
      left: '50%',
      width: '100%',
      height: 2,
    },
    trackDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    trackLabel: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
      marginTop: 6,
    },
    trackTime: {
      ...typography.caption,
      color: colors.textSubtle,
      textAlign: 'center',
      marginTop: 2,
    },
    chatCard: { paddingVertical: 16 },
    chatIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.electric + '1A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatTitle: {
      ...butcherTypography.primary,
      color: colors.textPrimary,
    },
    chatSub: {
      ...butcherTypography.meta,
      color: colors.textMuted,
      marginTop: 2,
    },
    infoRow: { paddingVertical: 5 },
    infoLabel: {
      ...butcherTypography.secondary,
      color: colors.textMuted,
      writingDirection: 'rtl',
      flexShrink: 0,
    },
    infoValueWrap: { flexShrink: 1, maxWidth: '62%' },
    infoValue: {
      ...butcherTypography.emphasis,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      textAlign: 'left',
    },
    infoValueStrong: {
      ...butcherTypography.title,
      color: colors.success,
    },
    itemRow: {
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSoft,
    },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    thumbImg: { width: '100%', height: '100%' },
    itemName: {
      ...butcherTypography.primary,
      color: colors.textPrimary,
    },
    itemMeta: {
      ...butcherTypography.meta,
      color: colors.textMuted,
      marginTop: 4,
    },
    itemPriceCol: { alignItems: 'flex-start', flexShrink: 0 },
    itemLinePrice: {
      ...butcherTypography.emphasis,
      color: colors.textPrimary,
    },
    itemQty: {
      ...butcherTypography.meta,
      color: colors.textMuted,
      marginTop: 2,
    },
    summaryBlock: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderSoft,
      gap: 2,
    },
    vatNote: {
      ...butcherTypography.meta,
      color: colors.textMuted,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    footerRow: { alignItems: 'stretch' },
    footerCard: {
      flex: 1,
      backgroundColor: colors.bgSurface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      padding: spacing.md,
      gap: 6,
      alignItems: 'flex-end',
    },
    footerTitle: {
      ...butcherTypography.emphasis,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      textAlign: 'right',
    },
    footerSub: {
      ...butcherTypography.meta,
      color: colors.textMuted,
      writingDirection: 'rtl',
      textAlign: 'right',
    },
    errorText: {
      ...butcherTypography.body,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 80,
    },
  });
}
