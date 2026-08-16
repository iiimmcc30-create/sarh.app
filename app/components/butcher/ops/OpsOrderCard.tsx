import { AppIcon } from '@/components/ui/FlaticonIcon';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  formatOpsOrderDate,
  formatOpsOrderTime,
  isDeliveryOrder,
  opsStatusAccent,
  opsStatusLabel,
  orderCustomerName,
  orderLineSummary,
  orderShortId,
  primaryAdvanceAction,
} from '@/lib/butcherOps';
import { getRtlRow } from '@/lib/rtl';
import { PAYMENT_STATUS_LABELS } from '@/services/butcherData';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';

type Props = {
  order: any;
  butcherAddress?: string;
  compact?: boolean;
  onOpen?: () => void;
  onAdvance?: (next: string) => void;
  onCancel?: () => void;
  onChat?: () => void;
};

/**
 * Outer butcher order card — matches the ops orders reference.
 */
export function OpsOrderCard({
  order,
  butcherAddress,
  onOpen,
  onAdvance,
  onCancel,
  onChat,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, scheme }) => createStyles(colors, scheme));
  const delivery = isDeliveryOrder(order);
  const statusColor = opsStatusAccent(order, colors.textMuted);
  const action = primaryAdvanceAction(order);
  const customer = orderCustomerName(order);
  const line = orderLineSummary(order);
  const location = delivery
    ? (order.deliveryAddress as string | undefined) || 'لم يُحدد عنوان التوصيل'
    : butcherAddress || 'استلام من الملحمة';
  const paidLabel =
    PAYMENT_STATUS_LABELS[order.paymentStatus as 'paid' | 'unpaid'] ??
    (order.paymentStatus === 'paid' ? 'مدفوع' : 'غير مدفوع');
  const total = `${Number(order.totalPrice || 0).toLocaleString('en-US')} ${
    order.currency === 'SAR' || !order.currency ? 'SAR' : order.currency
  }`;
  const allowed: string[] = Array.isArray(order.allowedNextStatuses)
    ? order.allowedNextStatuses
    : [];
  const dateLabel = formatOpsOrderDate(order.createdAt);
  const timeLabel = formatOpsOrderTime(order.createdAt);

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.97 }]}
    >
      <CoverTrailRow justify="space-between" gap={10}>
        <View style={styles.statusBlock}>
          <View
            style={[
              styles.badge,
              { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}55` },
            ]}
          >
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {opsStatusLabel(order.status, order.deliveryType)}
            </Text>
          </View>
          {dateLabel ? (
            <View style={[styles.metaTiny, getRtlRow()]}>
              <AppIcon name="calendar-outline" size={11} color={colors.textMuted} />
              <Text style={styles.metaTinyText}>{dateLabel}</Text>
            </View>
          ) : null}
          {timeLabel ? (
            <View style={[styles.metaTiny, getRtlRow()]}>
              <AppIcon name="time-outline" size={11} color={colors.textMuted} />
              <Text style={styles.metaTinyText}>{timeLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.customerBlock}>
          <Text style={styles.orderNo}>{orderShortId(order)}</Text>
          <View style={[styles.customerRow, getRtlRow()]}>
            <View style={styles.avatar}>
              <AppIcon name="person-outline" size={16} color={colors.textMuted} />
            </View>
            <View style={styles.customerText}>
              <Text style={styles.customer} numberOfLines={1}>
                {customer}
              </Text>
              <Text style={styles.lines} numberOfLines={1}>
                {line}
              </Text>
            </View>
          </View>
        </View>
      </CoverTrailRow>

      <View style={styles.detailRow}>
        <View style={styles.detailCol}>
          <AppIcon name="cube-outline" size={14} color={colors.textMuted} />
          <Text style={styles.detailText} numberOfLines={2}>
            {line}
          </Text>
        </View>
        <View style={styles.detailCol}>
          <AppIcon
            name={delivery ? 'bicycle-outline' : 'storefront-outline'}
            size={14}
            color={colors.textMuted}
          />
          <Text style={styles.detailText} numberOfLines={1}>
            {delivery ? 'توصيل الملحمة' : 'استلام'}
          </Text>
          <Text style={styles.detailSub} numberOfLines={2}>
            {location}
          </Text>
        </View>
        <View style={styles.detailCol}>
          <AppIcon
            name={order.paymentStatus === 'paid' ? 'checkmark-circle' : 'card-outline'}
            size={14}
            color={order.paymentStatus === 'paid' ? colors.electricBright : colors.textMuted}
          />
          <Text style={styles.detailText} numberOfLines={1}>
            {paidLabel}
          </Text>
          <Text style={styles.detailPrice} numberOfLines={1}>
            {total}
          </Text>
        </View>
      </View>

      <View style={[styles.actions, getRtlRow()]}>
        {onChat ? (
          <Pressable
            style={styles.chatBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onChat();
            }}
          >
            <View style={[styles.chatInner, getRtlRow()]}>
              <AppIcon name="chatbubble-outline" size={15} color={colors.electricBright} />
              <Text style={styles.chatText}>محادثة العميل</Text>
            </View>
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
            style={styles.cancelBtn}
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

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const cardBg = scheme === 'light' ? '#FFFFFF' : colors.bgElevated;
  return StyleSheet.create({
    card: {
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: spacing.md,
      marginBottom: spacing.sm,
      gap: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      shadowColor: '#000',
      shadowOpacity: scheme === 'light' ? 0.04 : 0,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: scheme === 'light' ? 1 : 0,
    },
    statusBlock: {
      alignItems: 'flex-start',
      gap: 4,
      maxWidth: '42%',
    },
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
    metaTiny: {
      alignItems: 'center',
      gap: 4,
    },
    metaTinyText: {
      ...typography.micro,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    customerBlock: {
      flex: 1,
      minWidth: 0,
      alignItems: 'flex-end',
      gap: 6,
    },
    orderNo: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    customerRow: {
      alignItems: 'center',
      gap: 8,
      maxWidth: '100%',
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    customerText: {
      flex: 1,
      minWidth: 0,
      alignItems: 'flex-end',
    },
    customer: {
      ...typography.bodyStrong,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      includeFontPadding: false,
      width: '100%',
    },
    lines: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
      includeFontPadding: false,
      width: '100%',
      marginTop: 2,
    },
    detailRow: {
      flexDirection: 'row-reverse',
      gap: 8,
      paddingTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSoft,
    },
    detailCol: {
      flex: 1,
      alignItems: 'flex-end',
      gap: 4,
      minWidth: 0,
    },
    detailText: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      includeFontPadding: false,
      width: '100%',
    },
    detailSub: {
      ...typography.micro,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
      includeFontPadding: false,
      width: '100%',
    },
    detailPrice: {
      ...typography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      includeFontPadding: false,
      width: '100%',
    },
    actions: {
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
    },
    chatBtn: {
      flexGrow: 1,
      minHeight: 42,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.electricBright,
      backgroundColor: cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },
    chatInner: {
      alignItems: 'center',
      gap: 6,
    },
    chatText: {
      ...typography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.electricBright,
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    primaryBtn: {
      flexGrow: 1,
      minHeight: 42,
      backgroundColor: colors.electricBright,
      borderRadius: 12,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryBtnText: {
      ...typography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: '#FFFFFF',
      includeFontPadding: false,
    },
    cancelBtn: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.danger}14`,
      borderWidth: 1,
      borderColor: `${colors.danger}44`,
    },
  });
}
