import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ds } from '@/constants/designSystem';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlText, getRtlDirection, getRtlRow } from '@/lib/rtl';
import {
  formatPlanFeatureText,
  planIcon,
  type PlanFeatureRow,
  type SubscriptionPlan,
} from '@/services/subscriptionPlans';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BillingCycle } from './subscriptionCopy';

const PREVIEW_FEATURES = 5;

type PlanTierCardProps = {
  plan: SubscriptionPlan;
  cycle: BillingCycle;
  selected: boolean;
  isCurrent: boolean;
  isRecommended: boolean;
  yearlyDiscount: number;
  onSelect: () => void;
};

function featureIncluded(f: PlanFeatureRow): boolean {
  if (f.valueType === 'BOOLEAN') return Boolean(f.value);
  if (f.valueType === 'NUMBER') return Number(f.value) > 0 || Number(f.value) < 0;
  return true;
}

export function PlanTierCard({
  plan,
  cycle,
  selected,
  isCurrent,
  isRecommended,
  yearlyDiscount,
  onSelect,
}: PlanTierCardProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  const isFree = plan.monthlyPrice === 0;
  const displayMonthly =
    cycle === 'yearly' && !isFree ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;

  const previewFeatures = (plan.displayFeatures ?? []).slice(0, PREVIEW_FEATURES);

  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        isRecommended && !selected && styles.cardRecommended,
        pressed && { opacity: 0.94 },
      ]}
    >
      <View style={[styles.badges, getRtlRow()]}>
        {isRecommended ? (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>الأكثر شيوعاً</Text>
          </View>
        ) : null}
        {isCurrent ? (
          <View style={styles.currentBadge}>
            <Text style={styles.currentText}>خطتك الحالية</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.head, getRtlRow()]}>
        <View style={styles.headText}>
          <Text style={styles.name}>{plan.name}</Text>
          <Text style={styles.desc} numberOfLines={2}>{plan.description}</Text>
        </View>
        <View style={styles.iconWrap}>
          <AppIcon name={planIcon(plan.slug)} size={20} color={colors.electric} />
        </View>
      </View>

      <View style={styles.priceBlock}>
        {isFree ? (
          <Text style={styles.priceFree}>مجاني</Text>
        ) : (
          <>
            <Text style={styles.price}>
              {displayMonthly}
              <Text style={styles.priceCurrency}> ر.س</Text>
            </Text>
            <Text style={styles.pricePer}>شهرياً</Text>
            {cycle === 'yearly' && yearlyDiscount > 0 ? (
              <Text style={styles.discount}>-{yearlyDiscount}% سنوياً</Text>
            ) : null}
          </>
        )}
      </View>

      <View style={styles.featureList}>
        {previewFeatures.map((f, i) => {
          const ok = featureIncluded(f);
          return (
            <View key={`${f.key}-${i}`} style={[styles.featureRow, getRtlRow()]}>
              <AppIcon
                name={ok ? 'check' : 'close'}
                size={14}
                color={ok ? colors.electric : colors.textSubtle}
              />
              <Text
                style={[styles.featureText, !ok && styles.featureMuted]}
                numberOfLines={2}
              >
                {formatPlanFeatureText(f.key, f.value, f.valueType)}
              </Text>
            </View>
          );
        })}
      </View>

      {selected ? (
        <View style={[styles.selectedMark, getRtlRow()]}>
          <AppIcon name="checkmark" size={14} color="#fff" />
          <Text style={styles.selectedMarkText}>محدّد للدفع</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: 280,
      borderRadius: ds.radius.lg,
      backgroundColor: colors.bgSurface,
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      gap: spacing.sm,
      ...getRtlDirection(),
    },
    cardSelected: {
      borderColor: colors.electric,
      borderWidth: 2,
      backgroundColor: `${colors.electric}06`,
    },
    cardRecommended: {
      borderColor: `${colors.electric}44`,
    },
    badges: {
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    recommendedBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: `${colors.electric}18`,
    },
    recommendedText: {
      ...typography.micro,
      color: colors.electric,
      fontWeight: '600',
    },
    currentBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
    },
    currentText: {
      ...typography.micro,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    head: {
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    headText: {
      flex: 1,
      gap: 4,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      ...typography.h3,
      color: colors.textPrimary,
      ...getRtlText(),
    },
    desc: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 18,
      ...getRtlText(),
    },
    priceBlock: {
      gap: 2,
      alignItems: 'flex-end',
    },
    priceFree: {
      fontSize: 28,
      fontWeight: '600',
      color: colors.electric,
    },
    price: {
      fontSize: 32,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 36,
    },
    priceCurrency: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textMuted,
    },
    pricePer: {
      ...typography.caption,
      color: colors.textMuted,
    },
    discount: {
      ...typography.micro,
      color: colors.success,
      fontWeight: '600',
    },
    featureList: {
      gap: 8,
      marginTop: spacing.xs,
    },
    featureRow: {
      alignItems: 'center',
      gap: 8,
    },
    featureText: {
      ...typography.caption,
      color: colors.textSecondary,
      flex: 1,
      ...getRtlText(),
    },
    featureMuted: {
      color: colors.textSubtle,
      textDecorationLine: 'line-through',
    },
    selectedMark: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.electric,
    },
    selectedMarkText: {
      ...typography.caption,
      color: '#fff',
      fontWeight: '600',
    },
  });
}
