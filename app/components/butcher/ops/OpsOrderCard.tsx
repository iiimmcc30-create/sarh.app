import { AppIcon } from '@/components/ui/FlaticonIcon';
import { butcherTypography } from '@/constants/butcherTypography';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  formatOrderDateTime,
  formatSar,
  isDeliveryOrder,
  opsStatusLabel,
  opsStatusTone,
  OPS_TONE_COLORS,
  orderCustomerName,
  orderLineSummary,
  orderQuantityLabel,
  orderShortId,
  primaryAdvanceAction,
} from '@/lib/butcherOps';
import { PAYMENT_STATUS_LABELS } from '@/services/butcherData';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  onOpen,
  onAdvance,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const delivery = isDeliveryOrder(order);
  const tone = opsStatusTone(order);
  const accent = OPS_TONE_COLORS[tone];
  const action = primaryAdvanceAction(order);
  const customer = orderCustomerName(order);
  const location = delivery
    ? (order.deliveryAddress as string | undefined) || 'لم يُحدد عنوان التوصيل'
    : butcherAddress || 'استلام من الملحمة';
  const created = formatOrderDateTime(order.createdAt);
  const allowed: string[] = Array.isArray(order.allowedNextStatuses) ? order.allowedNextStatuses : [];
  const paid = order.paymentStatus === 'paid';
  const canCancel = allowed.includes('cancelled') && !!onCancel;

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}>
      <View style={styles.topRow}>
        <View style={styles.qtyPrice}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>الكمية</Text>
            <Text style={styles.metricValue}>{orderQuantityLabel(order)}</Text>
          </View>
          <View style={styles.vDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>السعر الإجمالي</Text>
            <Text style={styles.metricValue}>{formatSar(order.totalPrice, order.currency || 'ر.س')}</Text>
            <View style={[styles.paidTag, { borderColor: `${accent}55` }]}>
              <Text style={[styles.paidTagText, { color: accent }]}>
                {PAYMENT_STATUS_LABELS[order.paymentStatus as 'paid' | 'unpaid'] ?? (paid ? 'مدفوع' : 'غير مدفوع')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.identity}>
          <Text style={styles.orderNo} numberOfLines={1}>
            {orderShortId(order).replace(/^#/, '')}
          </Text>
          <Text style={styles.customer} numberOfLines={1}>
            {customer}
          </Text>
          <Text style={styles.lines} numberOfLines={1}>
            {orderLineSummary(order)}
          </Text>
        </View>

        <View style={[styles.avatar, { backgroundColor: `${accent}22` }]}>
          <AppIcon name="person-outline" size={20} color={accent} />
        </View>
      </View>

      <View style={styles.midRow}>
        <View style={styles.fulfill}>
          <Text style={styles.fulfillLabel}>طريقة الاستلام</Text>
          <Text style={styles.fulfillValue}>{delivery ? 'توصيل الملحمة' : 'استلام من الملحمة'}</Text>
          <View style={styles.metaLine}>
            <AppIcon name="map-marker-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {location}
            </Text>
          </View>
          {created ? (
            <View style={styles.metaLine}>
              <AppIcon name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {created}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {canCancel ? (
          <Pressable
            style={styles.rejectBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onCancel?.();
            }}
          >
            <AppIcon name="close" size={14} color={colors.textPrimary} />
            <Text style={styles.rejectText}>رفض</Text>
          </Pressable>
        ) : null}
        {action && onAdvance ? (
          <Pressable
            style={[styles.acceptBtn, { backgroundColor: accent }]}
            onPress={(e) => {
              e.stopPropagation?.();
              onAdvance(action.next);
            }}
          >
            <AppIcon name="checkmark" size={14} color="#fff" />
            <Text style={styles.acceptText}>{action.label}</Text>
          </Pressable>
        ) : (
          <View style={styles.statusTag}>
            <View style={[styles.statusDot, { backgroundColor: accent }]} />
            <Text style={[styles.statusTagText, { color: accent }]}>
              {opsStatusLabel(order.status, order.deliveryType)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bgElevated,
      borderRadius: 16,
      padding: spacing.md,
      marginBottom: 8,
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    qtyPrice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      flexShrink: 0,
    },
    metric: {
      alignItems: 'flex-start',
      minWidth: 64,
    },
    metricLabel: {
      ...butcherTypography.meta,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      marginBottom: 2,
    },
    metricValue: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
    },
    vDivider: {
      width: StyleSheet.hairlineWidth,
      alignSelf: 'stretch',
      backgroundColor: colors.borderSoft,
    },
    paidTag: {
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      borderWidth: 1,
    },
    paidTagText: {
      ...butcherTypography.badge,
      fontFamily: OFFICIAL_APP_FONT,
    },
    identity: {
      flex: 1,
      minWidth: 0,
      alignItems: 'flex-end',
    },
    orderNo: {
      ...butcherTypography.meta,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
    },
    customer: {
      ...butcherTypography.primary,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    lines: {
      ...butcherTypography.secondary,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    midRow: {
      gap: 4,
    },
    fulfill: {
      alignItems: 'flex-end',
      gap: 3,
    },
    fulfillLabel: {
      ...butcherTypography.meta,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
    },
    fulfillValue: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      writingDirection: 'rtl',
    },
    metaLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      maxWidth: '100%',
    },
    metaText: {
      ...butcherTypography.secondary,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      flexShrink: 1,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 8,
    },
    acceptBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
    },
    acceptText: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: '#fff',
    },
    rejectBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    rejectText: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
    },
    statusTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusTagText: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
    },
  });
}
