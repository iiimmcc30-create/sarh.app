import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { StyleSheet, Text, View } from 'react-native';

type ButcherStoreStatsRowProps = {
  totalOrders: number;
  orderCompletionRate: number;
};

export function ButcherStoreStatsRow({
  totalOrders,
  orderCompletionRate,
}: ButcherStoreStatsRowProps) {
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  return (
    <View style={styles.row}>
      <View style={styles.cell}>
        <Text style={styles.value}>{totalOrders.toLocaleString('ar-SA')}</Text>
        <Text style={styles.label}>طلبات مكتملة</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.cell}>
        <Text style={styles.value}>{orderCompletionRate}%</Text>
        <Text style={styles.label}>نسبة إتمام</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      ...getRtlRow(),
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    cell: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    divider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.borderSoft,
      marginHorizontal: spacing.sm,
    },
    value: {
      ...typography.bodyStrong,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textPrimary,
      fontSize: 16,
    },
    label: {
      ...typography.micro,
      writingDirection: 'rtl', textAlign: 'right', color: colors.textMuted,
    },
  });
}
