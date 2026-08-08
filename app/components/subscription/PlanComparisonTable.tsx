import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ds } from '@/constants/designSystem';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlText, getRtlDirection, getRtlRow } from '@/lib/rtl';
import {
  formatPlanFeatureText,
  planDisplayName,
  type PlanFeatureRow,
  type SubscriptionPlan,
} from '@/services/subscriptionPlans';
import { StyleSheet, Text, View } from 'react-native';

type PlanComparisonTableProps = {
  plans: SubscriptionPlan[];
  title: string;
};

function collectFeatureKeys(plans: SubscriptionPlan[]): string[] {
  const keys = new Set<string>();
  for (const plan of plans) {
    for (const f of plan.displayFeatures ?? []) {
      keys.add(f.key);
    }
  }
  return Array.from(keys);
}

function findFeature(plan: SubscriptionPlan, key: string): PlanFeatureRow | undefined {
  return plan.displayFeatures?.find((f) => f.key === key);
}

function cellIncluded(f: PlanFeatureRow | undefined): boolean {
  if (!f) return false;
  if (f.valueType === 'BOOLEAN') return Boolean(f.value);
  if (f.valueType === 'NUMBER') return Number(f.value) > 0 || Number(f.value) < 0;
  return true;
}

export function PlanComparisonTable({ plans, title }: PlanComparisonTableProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));
  const featureKeys = collectFeatureKeys(plans);
  if (featureKeys.length === 0 || plans.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.table}>
        <View style={[styles.headerRow, getRtlRow()]}>
          <View style={styles.featureCol}>
            <Text style={styles.headerFeature}>الميزة</Text>
          </View>
          {plans.map((plan) => (
            <View key={plan.slug} style={styles.planCol}>
              <Text style={styles.headerPlan} numberOfLines={1}>
                {planDisplayName(plan.slug, plan.name)}
              </Text>
            </View>
          ))}
        </View>

        {featureKeys.map((key) => {
          const label =
            findFeature(plans[0], key)?.label ??
            findFeature(plans.find((p) => findFeature(p, key)) ?? plans[0], key)?.label ??
            key;

          return (
            <View key={key} style={[styles.bodyRow, getRtlRow()]}>
              <View style={styles.featureCol}>
                <Text style={styles.featureLabel} numberOfLines={2}>{label}</Text>
              </View>
              {plans.map((plan) => {
                const f = findFeature(plan, key);
                const ok = cellIncluded(f);
                return (
                  <View key={plan.slug} style={styles.planCol}>
                    {f ? (
                      ok ? (
                        <Text style={styles.cellValue} numberOfLines={2}>
                          {formatPlanFeatureText(f.key, f.value, f.valueType)}
                        </Text>
                      ) : (
                        <AppIcon name="close" size={16} color={colors.textSubtle} />
                      )
                    ) : (
                      <AppIcon name="close" size={16} color={colors.textSubtle} />
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.md,
      marginTop: spacing.lg,
      ...getRtlDirection(),
    },
    title: {
      ...typography.h3,
      color: colors.textPrimary,
      ...getRtlText(),
    },
    table: {
      borderRadius: ds.radius.lg,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
    },
    headerRow: {
      backgroundColor: colors.bgElevated,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSoft,
    },
    bodyRow: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSoft,
      alignItems: 'center',
    },
    featureCol: {
      flex: 1.4,
      minWidth: 0,
    },
    planCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 72,
      paddingHorizontal: 4,
    },
    headerFeature: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '700',
      ...getRtlText(),
    },
    headerPlan: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '800',
      textAlign: 'center',
    },
    featureLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      ...getRtlText(),
    },
    cellValue: {
      ...typography.micro,
      color: colors.textPrimary,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}
