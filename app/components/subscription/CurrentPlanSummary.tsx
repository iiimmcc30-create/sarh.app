import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ds } from '@/constants/designSystem';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { rtlDirection, rtlRow } from '@/lib/rtl';
import {
  planDisplayName,
  planIcon,
  type SubscriptionPlan,
} from '@/services/subscriptionPlans';
import { StyleSheet, Text, View } from 'react-native';

type UsageCounters = {
  dailyAdsUsed: number;
  liveMinutesUsed: number;
  featuredAdsUsed: number;
  pinnedAdsUsed: number;
};

type CurrentPlanSummaryProps = {
  plan: SubscriptionPlan;
  planSlug: string;
  renewDate: string;
  permissions: SubscriptionPlan['permissions'];
  usageCounters: UsageCounters;
};

export function CurrentPlanSummary({
  plan,
  planSlug,
  renewDate,
  permissions,
  usageCounters,
}: CurrentPlanSummaryProps) {
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  const dailyLimit = permissions.maxAdsPer24Hours;
  const dailyUsed = usageCounters.dailyAdsUsed;
  const liveHours = permissions.monthlyLiveHours;
  const liveUsed = usageCounters.liveMinutesUsed;
  const liveLimitMin =
    typeof liveHours === 'number' && liveHours < 0
      ? null
      : typeof liveHours === 'number'
        ? liveHours * 60
        : null;

  const featuredLimit = Number(permissions.monthlyFeaturedAds ?? 0);
  const pinnedLimit = Number(permissions.monthlyPinnedAds ?? 0);

  return (
    <View style={styles.card}>
      <View style={[styles.top, rtlRow]}>
        <View style={styles.info}>
          <Text style={styles.label}>خطتك الحالية</Text>
          <Text style={styles.name}>{planDisplayName(plan.slug, plan.name)}</Text>
          <Text style={styles.price}>
            {planSlug === 'free' || plan.monthlyPrice === 0
              ? 'مجاني'
              : `${plan.monthlyPrice} ر.س / شهر`}
          </Text>
          {planSlug !== 'free' ? (
            <Text style={styles.renew}>
              التجديد: {new Date(renewDate).toLocaleDateString('ar-SA')}
            </Text>
          ) : (
            <Text style={styles.renew}>يمكنك الترقية لأي خطة مدفوعة أدناه</Text>
          )}
        </View>
        <View style={styles.iconWrap}>
          <AppIcon name={planIcon(plan.slug)} size={22} color={colors.electric} />
        </View>
      </View>

      <View style={styles.usageGrid}>
        <UsageMeter
          label="إعلانات اليوم"
          used={dailyUsed}
          limit={dailyLimit}
          styles={styles}
        />
        <UsageMeter
          label="دقائق البث"
          used={liveUsed}
          limit={liveLimitMin}
          styles={styles}
        />
        {featuredLimit > 0 ? (
          <UsageMeter
            label="تمييز شهري"
            used={usageCounters.featuredAdsUsed ?? 0}
            limit={featuredLimit}
            styles={styles}
          />
        ) : null}
        {pinnedLimit > 0 ? (
          <UsageMeter
            label="تثبيت شهري"
            used={usageCounters.pinnedAdsUsed ?? 0}
            limit={pinnedLimit}
            styles={styles}
          />
        ) : null}
      </View>

      {permissions.prioritySearch ? (
        <View style={[styles.priorityRow, rtlRow]}>
          <AppIcon name="trending-up-outline" size={14} color={colors.electric} />
          <Text style={styles.priorityText}>أولوية في البحث والصفحة الرئيسية</Text>
        </View>
      ) : null}
    </View>
  );
}

function UsageMeter({
  label,
  used,
  limit,
  styles,
}: {
  label: string;
  used: number;
  limit: number | null | undefined;
  styles: ReturnType<typeof createStyles>;
}) {
  const limitLabel =
    typeof limit === 'number' && limit < 0
      ? '∞'
      : limit != null
        ? String(limit)
        : '—';
  const pct =
    typeof limit === 'number' && limit > 0
      ? Math.min((used / limit) * 100, 100)
      : typeof limit === 'number' && limit < 0
        ? 12
        : 0;

  return (
    <View style={styles.usageItem}>
      <View style={[styles.usageTop, rtlRow]}>
        <Text style={styles.usageLabel}>{label}</Text>
        <Text style={styles.usageVal}>{used}/{limitLabel}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: ds.radius.lg,
      backgroundColor: colors.bgSurface,
      padding: spacing.md,
      gap: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      ...rtlDirection,
    },
    top: {
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    info: {
      flex: 1,
      gap: 4,
      alignItems: 'flex-end',
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...typography.caption,
      color: colors.textMuted,
    },
    name: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: 'right',
    },
    price: {
      ...typography.bodyStrong,
      color: colors.electric,
      textAlign: 'right',
    },
    renew: {
      ...typography.micro,
      color: colors.textMuted,
      textAlign: 'right',
    },
    usageGrid: {
      gap: spacing.sm,
    },
    usageItem: {
      gap: 6,
    },
    usageTop: {
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    usageLabel: {
      ...typography.caption,
      color: colors.textMuted,
    },
    usageVal: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    track: {
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.bgElevated,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: colors.electric,
      alignSelf: 'flex-end',
    },
    priorityRow: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: `${colors.electric}10`,
    },
    priorityText: {
      ...typography.caption,
      color: colors.electric,
      fontWeight: '600',
      flex: 1,
      textAlign: 'right',
    },
  });
}
