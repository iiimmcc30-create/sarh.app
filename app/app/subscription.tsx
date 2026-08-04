// Powered by OnSpace.AI — Cursor-style subscription plans (user + butcher audiences)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { CurrentPlanSummary } from '@/components/subscription/CurrentPlanSummary';
import { PlanBillingToggle } from '@/components/subscription/PlanBillingToggle';
import { PlanComparisonTable } from '@/components/subscription/PlanComparisonTable';
import { PlanTierCard } from '@/components/subscription/PlanTierCard';
import {
  planCtaLabel,
  subscriptionHeroCopy,
  type BillingCycle,
} from '@/components/subscription/subscriptionCopy';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePlans } from '@/hooks/usePlans';
import { useSubscriptionAudience } from '@/hooks/useSubscriptionAudience';
import { type PlanSlug } from '@/services/subscriptionPlans';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { rtlBackIcon, rtlDirection, rtlRow } from '@/lib/rtl';

function yearlyDiscount(plan: { monthlyPrice: number; yearlyPrice: number }) {
  if (plan.monthlyPrice <= 0 || plan.yearlyPrice <= 0) return 0;
  const pct = Math.round(100 - (plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100);
  return pct > 0 ? pct : 0;
}

function recommendedSlug(
  plans: Array<{ slug: string; monthlyPrice: number; sortOrder: number }>,
): string | null {
  const paid = plans
    .filter((p) => p.monthlyPrice > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (paid.length === 0) return null;
  const mid = paid[Math.floor((paid.length - 1) / 2)] ?? paid[paid.length - 1];
  return mid.slug;
}

export default function SubscriptionScreen() {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));
  const router = useRouter();
  const { subscription } = useSubscription();
  const audience = useSubscriptionAudience();
  const hero = subscriptionHeroCopy(audience);
  const { plans, loading, getPlanBySlug } = usePlans(audience);

  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const paidDefault =
    plans.find((p) => p.monthlyPrice > 0)?.slug ??
    (audience === 'BUTCHER' ? 'nom-pro' : 'sarh-pro');
  const [selected, setSelected] = useState<PlanSlug>(
    subscription.planSlug === 'free' ? paidDefault : subscription.planSlug,
  );

  useEffect(() => {
    if (subscription.planSlug === 'free') {
      setSelected((prev) => (prev === 'free' ? paidDefault : prev));
    }
  }, [subscription.planSlug, paidDefault]);

  const currentPlan = getPlanBySlug(subscription.planSlug);
  const displayPlans = useMemo(
    () => plans.filter((p) => p.slug !== 'free'),
    [plans],
  );
  const comparePlans = useMemo(
    () => plans.sort((a, b) => a.sortOrder - b.sortOrder),
    [plans],
  );
  const recommended = recommendedSlug(displayPlans);
  const isCurrent = (slug: PlanSlug) => slug === subscription.planSlug;

  const handleContinue = () => {
    if (selected === 'free') return;
    router.push({ pathname: '/payment', params: { planId: selected, cycle } });
  };

  const selectedPlan = getPlanBySlug(selected);
  const ctaAmount =
    cycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;

  return (
    <ScreenScaffold edges={['top']}>
      <View style={[styles.screen, rtlDirection]}>
        <View style={[styles.header, rtlRow]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{hero.title}</Text>
            <Text style={styles.headerSub}>{hero.subtitle}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.toggleWrap}>
          <PlanBillingToggle cycle={cycle} onChange={setCycle} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <CurrentPlanSummary
            plan={currentPlan}
            planSlug={subscription.planSlug}
            renewDate={subscription.renewDate}
            permissions={subscription.permissions}
            usageCounters={subscription.usageCounters}
          />

          <Text style={styles.sectionTitle}>{hero.upgradeSection}</Text>

          {loading ? (
            <ActivityIndicator style={{ marginVertical: spacing.xl }} color={colors.electric} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tierRow}
            >
              {displayPlans.map((plan) => (
                <PlanTierCard
                  key={plan.slug}
                  plan={plan}
                  cycle={cycle}
                  selected={selected === plan.slug}
                  isCurrent={isCurrent(plan.slug)}
                  isRecommended={recommended === plan.slug}
                  yearlyDiscount={yearlyDiscount(plan)}
                  onSelect={() => setSelected(plan.slug)}
                />
              ))}
            </ScrollView>
          )}

          <PlanComparisonTable plans={comparePlans} title={hero.compareTitle} />

          <View style={[styles.paymentBadge, rtlRow]}>
            <AppIcon name="shield-check" size={18} color={colors.success} />
            <Text style={styles.paymentBadgeText}>
              مدفوعات آمنة عبر Network International · مدى · فيزا · Apple Pay · STC Pay
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.ctaWrap}>
          {selected === 'free' ? (
            <Pressable onPress={() => router.back()} style={styles.ctaSecondary}>
              <Text style={styles.ctaSecondaryText}>{hero.freeCta}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.ctaBtnText}>
                {planCtaLabel(selected, isCurrent(selected), false)}
                {ctaAmount > 0 ? ` · ${ctaAmount} ر.س` : ''}
              </Text>
            </Pressable>
          )}
        </SafeAreaView>
      </View>
    </ScreenScaffold>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1 },
    header: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    headerSpacer: { width: 40 },
    headerTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    headerSub: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    toggleWrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.md,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      textAlign: 'right',
      marginTop: spacing.sm,
    },
    tierRow: {
      gap: spacing.md,
      paddingVertical: spacing.sm,
      paddingRight: spacing.xs,
    },
    paymentBadge: {
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 16,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      marginTop: spacing.md,
    },
    paymentBadgeText: {
      ...typography.caption,
      color: colors.textMuted,
      flex: 1,
      lineHeight: 20,
      textAlign: 'right',
    },
    ctaWrap: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      backgroundColor: colors.bgDeep,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSoft,
    },
    ctaBtn: {
      backgroundColor: colors.electric,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaBtnText: {
      ...typography.bodyStrong,
      color: '#fff',
      fontSize: 16,
    },
    ctaSecondary: {
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      alignItems: 'center',
    },
    ctaSecondaryText: {
      ...typography.bodyStrong,
      color: colors.textMuted,
    },
  });
}
