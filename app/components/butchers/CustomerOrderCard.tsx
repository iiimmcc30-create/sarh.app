import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { butcherTypography } from '@/constants/butcherTypography';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import {
  formatOrderDatePart,
  formatOrderTimePart,
  orderProductSummary,
  orderSpecsLine,
} from '@/lib/customerOrders';
import { ORDER_STATUS_COLORS, orderStatusLabel, PAYMENT_STATUS_LABELS } from '@/services/butcherData';
import { ButcherOrderRecord, formatCurrency } from '@/services/butcherOrders';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function CustomerOrderCard({
  order,
  onPress,
  onChat,
  colors,
}: {
  order: ButcherOrderRecord;
  onPress: () => void;
  onChat?: () => void;
  colors: ThemeColors;
}) {
  const styles = createStyles(colors);
  const statusColor = ORDER_STATUS_COLORS[order.status] ?? colors.textMuted;
  const statusText = orderStatusLabel(order.status, order.deliveryType);
  const isPaid = order.paymentStatus === 'paid';
  const logo = uriSource(order.butcher?.logo);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}
    >
      <CoverTrailRow justify="space-between" gap={spacing.md} style={styles.topRow}>
        <View style={styles.metaCol}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '1F', borderColor: statusColor + '33' },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
          <CoverTrailRow gap={6}>
            <AppIcon name="calendar-outline" size={13} color={colors.textMuted} />
            <Text style={styles.stampText}>{formatOrderDatePart(order.createdAt)}</Text>
          </CoverTrailRow>
          <CoverTrailRow gap={6}>
            <AppIcon name="time-outline" size={13} color={colors.textMuted} />
            <Text style={styles.stampText}>{formatOrderTimePart(order.createdAt)}</Text>
          </CoverTrailRow>
        </View>

        <CoverTrailRow flex justify="flex-end" gap={spacing.sm} style={styles.identityRow}>
          <RtlTextShell flex>
            <RtlText style={styles.butcherName} numberOfLines={1}>
              {order.butcher?.nameAr ?? 'ملحمة'}
            </RtlText>
            <RtlText style={styles.productName} numberOfLines={1}>
              {orderProductSummary(order)}
            </RtlText>
            <RtlText style={styles.productMeta} numberOfLines={1}>
              {orderSpecsLine(order)}
            </RtlText>
          </RtlTextShell>
          <View style={styles.logoWrap}>
            {logo ? (
              <Image source={logo} style={styles.logo} contentFit="cover" />
            ) : (
              <AppIcon name="storefront-outline" size={18} color="#F5F7F9" />
            )}
          </View>
        </CoverTrailRow>
      </CoverTrailRow>

      <View style={[styles.divider, { borderColor: colors.borderSoft }]} />

      <CoverTrailRow justify="space-between" gap={spacing.sm} style={styles.bottomRow}>
        <View style={styles.totalCol}>
          <Text style={styles.totalValue}>{formatCurrency(order.totalPrice, order.currency)}</Text>
          <Text style={styles.totalLabel}>الإجمالي</Text>
        </View>

        <View style={styles.idCol}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={[styles.payText, { color: isPaid ? colors.success : colors.gold }]}>
            {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </Text>
        </View>

        {onChat ? (
          <Pressable
            onPress={onChat}
            style={({ pressed }) => [styles.chatPill, pressed && { opacity: 0.88 }]}
          >
            <CoverTrailRow gap={6}>
              <Text style={styles.chatPillText}>محادثة الملحمة</Text>
              <AppIcon name="chatbubbles-outline" size={15} color={colors.electricBright} />
            </CoverTrailRow>
          </Pressable>
        ) : (
          <View style={styles.chatSpacer} />
        )}
      </CoverTrailRow>
    </Pressable>
  );
}

export function CustomerOrderCardSkeleton({ colors }: { colors: ThemeColors }) {
  const styles = createStyles(colors);
  return (
    <View style={styles.card}>
      <CoverTrailRow justify="space-between">
        <View style={{ gap: 8 }}>
          <View style={[styles.skeleton, { width: 78, height: 22, borderRadius: 999 }]} />
          <View style={[styles.skeleton, { width: 96, height: 10, borderRadius: 6 }]} />
        </View>
        <View style={[styles.logoWrap, styles.skeleton]} />
      </CoverTrailRow>
      <View style={[styles.divider, { borderColor: colors.borderSoft }]} />
      <View style={[styles.skeleton, { width: '70%', height: 16, borderRadius: 8, alignSelf: 'flex-end' }]} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bgElevated,
      borderRadius: 16,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      gap: spacing.md,
    },
    topRow: { alignItems: 'flex-start' },
    identityRow: { alignItems: 'flex-start' },
    metaCol: {
      alignItems: 'flex-start',
      gap: 6,
      flexShrink: 0,
      maxWidth: '42%',
    },
    logoWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: '#152033',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    logo: { width: '100%', height: '100%' },
    butcherName: {
      ...butcherTypography.primary,
      color: colors.textPrimary,
    },
    productName: {
      ...typography.secondary,
      color: colors.textSecondary,
      marginTop: 2,
    },
    productMeta: {
      ...butcherTypography.meta,
      color: colors.textMuted,
      marginTop: 2,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { ...butcherTypography.emphasis, writingDirection: 'rtl' },
    stampText: {
      ...butcherTypography.meta,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
    divider: {
      borderBottomWidth: 1,
      borderStyle: 'dashed',
    },
    bottomRow: { alignItems: 'center' },
    totalCol: { alignItems: 'flex-start', flexShrink: 0 },
    totalValue: {
      ...butcherTypography.title,
      color: colors.textPrimary,
    },
    totalLabel: {
      ...butcherTypography.meta,
      color: colors.textMuted,
    },
    idCol: {
      flex: 1,
      alignItems: 'center',
      minWidth: 0,
    },
    orderNumber: {
      ...butcherTypography.meta,
      color: colors.textMuted,
    },
    payText: { ...butcherTypography.emphasis, writingDirection: 'rtl' },
    chatPill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.electric + '1A',
      flexShrink: 0,
    },
    chatPillText: {
      ...typography.caption,
      color: colors.electricBright,
      writingDirection: 'rtl',
    },
    chatSpacer: { width: 12 },
    skeleton: {
      backgroundColor: colors.bgSurface,
      opacity: 0.7,
    },
  });
}
