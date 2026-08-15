import { AppIcon } from '@/components/ui/FlaticonIcon';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  isDeliveryOrder,
  mapsUrlForAddress,
  opsStatusLabel,
  orderCustomerName,
  orderLineSummary,
  orderShortId,
  primaryAdvanceAction,
  OPS_STATUS_COLORS,
} from '@/lib/butcherOps';
import { PAYMENT_STATUS_LABELS } from '@/services/butcherData';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  order: any;
  butcherAddress?: string;
  compact?: boolean;
  onOpen?: () => void;
  onAdvance?: (next: string) => void;
  onCancel?: () => void;
  onChat?: () => void;
};

export function OpsOrderCard({
  order,
  butcherAddress,
  compact,
  onOpen,
  onAdvance,
  onCancel,
  onChat,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const delivery = isDeliveryOrder(order);
  const statusColor = OPS_STATUS_COLORS[order.status] ?? colors.textMuted;
  const action = primaryAdvanceAction(order);
  const customer = orderCustomerName(order);
  const phone = order.customer?.phone as string | undefined;
  const location = delivery
    ? (order.deliveryAddress as string | undefined) || 'لم يُحدد عنوان التوصيل'
    : butcherAddress || 'استلام من الملحمة';
  const created = order.createdAt
    ? new Date(order.createdAt).toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
    : '';
  const allowed: string[] = Array.isArray(order.allowedNextStatuses) ? order.allowedNextStatuses : [];
  const showDeliveryPanel = delivery && order.status === 'ready';

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}>
      <View style={styles.coverTrail}>
        <View style={[styles.badge, { backgroundColor: `${statusColor}22`, borderColor: `${statusColor}55` }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {opsStatusLabel(order.status, order.deliveryType)}
          </Text>
        </View>
        <View style={styles.rtlTextShellFlex}>
          <Text style={styles.orderNo}>{orderShortId(order)}</Text>
          <Text style={styles.customer} numberOfLines={1}>{customer}</Text>
        </View>
      </View>

      <View style={styles.rtlTextShell}>
        <Text style={styles.lines} numberOfLines={compact ? 1 : 2}>
          {orderLineSummary(order)}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.total}>
          {Number(order.totalPrice || 0).toLocaleString()} {order.currency || 'ر.س'}
        </Text>
        <View style={styles.chip}>
          <AppIcon name={delivery ? 'bicycle-outline' : 'storefront-outline'} size={13} color={colors.textSecondary} />
          <Text style={styles.chipText}>{delivery ? 'توصيل الملحمة' : 'استلام'}</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.chipText}>
            {PAYMENT_STATUS_LABELS[order.paymentStatus as 'paid' | 'unpaid'] ?? paymentFallback(order.paymentStatus)}
          </Text>
        </View>
      </View>

      {!compact ? (
        <>
          <View style={styles.coverTrail}>
            <AppIcon name="time-outline" size={14} color={colors.textMuted} />
            <View style={styles.rtlTextShellFlex}>
              <Text style={styles.muted}>{created}</Text>
            </View>
          </View>
          <View style={styles.coverTrail}>
            <AppIcon name="location-outline" size={14} color={colors.textMuted} />
            <View style={styles.rtlTextShellFlex}>
              <Text style={styles.muted} numberOfLines={2}>{location}</Text>
            </View>
          </View>
          {phone ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                void Linking.openURL(`tel:${phone}`);
              }}
              style={styles.coverTrail}
            >
              <AppIcon name="call-outline" size={14} color={colors.electric} />
              <View style={styles.rtlTextShellFlex}>
                <Text style={styles.phone}>{phone}</Text>
              </View>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {showDeliveryPanel ? (
        <View style={styles.deliveryPanel}>
          <View style={styles.rtlTextShell}>
            <Text style={styles.deliveryTitle}>جاهز للتوصيل</Text>
            <Text style={styles.muted} numberOfLines={2}>{location}</Text>
            {order.notes ? <Text style={styles.notes}>ملاحظات: {order.notes}</Text> : null}
          </View>
          {delivery && order.deliveryAddress ? (
            <Pressable
              style={styles.secondaryBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                void Linking.openURL(mapsUrlForAddress(String(order.deliveryAddress)));
              }}
            >
              <AppIcon name="navigate-outline" size={16} color={colors.electric} />
              <Text style={styles.secondaryBtnText}>فتح الموقع</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        {onChat ? (
          <Pressable
            style={styles.iconBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onChat();
            }}
          >
            <AppIcon name="chatbubble-outline" size={16} color={colors.electric} />
          </Pressable>
        ) : null}
        {action && onAdvance ? (
          <Pressable
            style={styles.primaryBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onAdvance(action.next);
            }}
          >
            <Text style={styles.primaryBtnText}>{action.label}</Text>
          </Pressable>
        ) : null}
        {allowed.includes('cancelled') && onCancel ? (
          <Pressable
            style={styles.iconBtnDanger}
            onPress={(e) => {
              e.stopPropagation?.();
              onCancel();
            }}
          >
            <AppIcon name="close" size={16} color={colors.danger} />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

function paymentFallback(status?: string) {
  if (status === 'paid') return 'مدفوع';
  return 'غير مدفوع';
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bgElevated,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.sm,
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(150,175,185,0.18)',
    },
    coverTrail: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 8,
    },
    rtlTextShell: {
      width: '100%',
      direction: 'ltr',
    },
    rtlTextShellFlex: {
      flex: 1,
      direction: 'ltr',
    },
    orderNo: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    customer: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
    },
    badgeText: { ...typography.micro, fontWeight: '600' },
    lines: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    metaRow: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    total: { ...typography.bodyStrong, color: colors.textPrimary },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.bgSurface,
    },
    chipText: {
      ...typography.micro,
      color: colors.textSecondary,
      writingDirection: 'rtl',
    },
    muted: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    phone: {
      ...typography.caption,
      color: colors.electric,
      fontWeight: '600',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    notes: {
      ...typography.micro,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
      marginTop: 4,
    },
    deliveryPanel: {
      backgroundColor: colors.bgSurface,
      borderRadius: 12,
      padding: spacing.sm,
      gap: 8,
    },
    deliveryTitle: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '600',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(150,175,185,0.18)',
    },
    secondaryBtnText: { ...typography.caption, color: colors.electric, fontWeight: '600' },
    actions: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 8,
      marginTop: 4,
    },
    primaryBtn: {
      flex: 1,
      backgroundColor: '#20B66F',
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: 'center',
    },
    primaryBtnText: { ...typography.bodyStrong, color: '#F4F6F5' },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: 'rgba(150,175,185,0.18)',
    },
    iconBtnDanger: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.danger}14`,
      borderWidth: 1,
      borderColor: `${colors.danger}44`,
    },
  });
}
