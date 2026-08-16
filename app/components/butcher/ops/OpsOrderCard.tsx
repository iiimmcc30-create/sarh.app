import { AppIcon } from '@/components/ui/FlaticonIcon';
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { butcherTypography } from '@/constants/butcherTypography';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  formatOpsWhen,
  formatSar,
  isDeliveryOrder,
  opsStatusLabel,
  opsStatusTone,
  OPS_TONE_COLORS,
  orderCustomerName,
  orderProductTitle,
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
  const when = formatOpsWhen(order.scheduledAt || order.createdAt);
  const allowed: string[] = Array.isArray(order.allowedNextStatuses) ? order.allowedNextStatuses : [];
  const paid = order.paymentStatus === 'paid';
  const canCancel = allowed.includes('cancelled') && !!onCancel;
  const cancelLabel = order.status === 'pending' ? 'رفض' : 'إلغاء';

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}>
      <CoverTrailRow justify="space-between" gap={8} style={styles.mainRow}>
        <Pressable
          hitSlop={8}
          onPress={(e) => {
            e.stopPropagation?.();
            onOpen?.();
          }}
          style={styles.menuBtn}
        >
          <AppIcon name="menu-dots-vertical" size={18} color={colors.textMuted} />
        </Pressable>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>الكمية</Text>
            <Text style={styles.metricValue}>{orderQuantityLabel(order)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>السعر الإجمالي</Text>
            <Text style={styles.metricValue}>{formatSar(order.totalPrice, order.currency || 'ر.س')}</Text>
          </View>
          <View
            style={[
              styles.paidTag,
              {
                backgroundColor: (paid ? colors.success : colors.gold) + '1F',
                borderColor: (paid ? colors.success : colors.gold) + '44',
              },
            ]}
          >
            <Text style={[styles.paidTagText, { color: paid ? colors.success : colors.gold }]}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus as 'paid' | 'unpaid'] ?? (paid ? 'مدفوع' : 'غير مدفوع')}
            </Text>
          </View>
        </View>

        <View style={styles.fulfill}>
          <Text style={styles.fulfillLabel}>طريقة الاستلام</Text>
          <Text style={styles.fulfillValue}>{delivery ? 'توصيل الملحمة' : 'استلام من الملحمة'}</Text>
          <CoverTrailRow gap={5} style={styles.metaLine}>
            <AppIcon name="map-marker-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {location}
            </Text>
          </CoverTrailRow>
          {when ? (
            <CoverTrailRow gap={5} style={styles.metaLine}>
              <AppIcon name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {when}
              </Text>
            </CoverTrailRow>
          ) : null}
        </View>

        <CoverTrailRow flex justify="flex-end" gap={8} style={styles.identityRow}>
          <RtlTextShell flex>
            <RtlText style={styles.orderNo} numberOfLines={1}>
              {orderShortId(order).replace(/^#/, '')}
            </RtlText>
            <RtlText style={styles.customer} numberOfLines={1}>
              {customer}
            </RtlText>
            <RtlText style={styles.lines} numberOfLines={1}>
              {orderProductTitle(order)}
            </RtlText>
          </RtlTextShell>
          <View style={[styles.avatar, { backgroundColor: `${accent}22` }]}>
            <AppIcon name="person-outline" size={20} color={accent} />
          </View>
        </CoverTrailRow>
      </CoverTrailRow>

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
            <Text style={styles.rejectText}>{cancelLabel}</Text>
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
          <View style={[styles.statusTag, { backgroundColor: `${accent}1A` }]}>
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
      gap: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    mainRow: { alignItems: 'flex-start' },
    menuBtn: {
      width: 28,
      alignItems: 'center',
      paddingTop: 4,
      flexShrink: 0,
    },
    metrics: {
      alignItems: 'flex-start',
      gap: 2,
      flexShrink: 0,
      minWidth: 72,
    },
    metric: { alignItems: 'flex-start' },
    metricLabel: {
      ...butcherTypography.meta,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
    },
    metricValue: {
      ...butcherTypography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
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
    fulfill: {
      flex: 1.1,
      minWidth: 0,
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
      textAlign: 'right',
    },
    metaLine: { maxWidth: '100%' },
    metaText: {
      ...butcherTypography.secondary,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      flexShrink: 1,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    identityRow: { flex: 1.15, minWidth: 0, alignItems: 'flex-start' },
    orderNo: {
      ...butcherTypography.meta,
      color: colors.textMuted,
    },
    customer: {
      ...butcherTypography.primary,
      color: colors.textPrimary,
    },
    lines: {
      ...butcherTypography.secondary,
      color: colors.textSecondary,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
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
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 12,
      flexGrow: 1,
      maxWidth: '58%',
      justifyContent: 'center',
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
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      justifyContent: 'center',
      minWidth: 88,
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
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
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
