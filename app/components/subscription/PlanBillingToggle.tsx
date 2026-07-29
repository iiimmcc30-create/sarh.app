import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { rtlRow } from '@/lib/rtl';
import type { BillingCycle } from './subscriptionCopy';

type PlanBillingToggleProps = {
  cycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  yearlySaveLabel?: string;
};

export function PlanBillingToggle({
  cycle,
  onChange,
  yearlySaveLabel = 'وفّر 20%',
}: PlanBillingToggleProps) {
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  return (
    <View style={[styles.row, rtlRow]}>
      <Pressable
        onPress={() => onChange('monthly')}
        style={[styles.btn, cycle === 'monthly' && styles.btnActive]}
      >
        <Text style={[styles.label, cycle === 'monthly' && styles.labelActive]}>شهري</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('yearly')}
        style={[styles.btn, rtlRow, cycle === 'yearly' && styles.btnActive]}
      >
        <Text style={[styles.label, cycle === 'yearly' && styles.labelActive]}>سنوي</Text>
        <View style={styles.savePill}>
          <Text style={styles.saveText}>{yearlySaveLabel}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      ...rtlRow,
      alignSelf: 'center',
      backgroundColor: colors.bgSurface,
      borderRadius: radius.pill,
      padding: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      gap: 2,
    },
    btn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      minWidth: 120,
    },
    btnActive: {
      backgroundColor: colors.electric,
    },
    label: {
      ...typography.bodyStrong,
      color: colors.textMuted,
      fontSize: 14,
    },
    labelActive: {
      color: '#fff',
    },
    savePill: {
      backgroundColor: colors.success,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    saveText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#fff',
    },
  });
}
