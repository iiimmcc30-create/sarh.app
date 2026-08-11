import { AppIcon } from '@/components/ui/FlaticonIcon';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { usePlanPromotionQuota } from '@/hooks/usePlanPromotionQuota';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlText, getRtlDirection, getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type PlanPromotionOptionsProps = {
  featured: boolean;
  pinned: boolean;
  onFeaturedChange: (value: boolean) => void;
  onPinnedChange: (value: boolean) => void;
  compact?: boolean;
};

type OptionKey = 'featured' | 'pinned';

function UsageChip({
  used,
  limit,
  styles,
}: {
  used: number;
  limit: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const remaining = limit > 0 ? Math.max(0, limit - used) : 0;

  return (
    <View style={styles.usageChip}>
      <Text style={styles.usageChipText}>
        {remaining} متبقي من {limit}
      </Text>
    </View>
  );
}

export function PlanPromotionOptions({
  featured,
  pinned,
  onFeaturedChange,
  onPinnedChange,
  compact = false,
}: PlanPromotionOptionsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const quota = usePlanPromotionQuota();

  const options: Array<{
    key: OptionKey;
    icon: string;
    title: string;
    subtitle: string;
    active: boolean;
    enabled: boolean;
    used: number;
    limit: number;
    onToggle: () => void;
  }> = [
    {
      key: 'pinned',
      icon: 'pin',
      title: 'تثبيت من باقتي',
      subtitle: 'يظهر في أعلى قائمة الإعلانات',
      active: pinned,
      enabled: quota.canPin,
      used: quota.pinnedUsed,
      limit: quota.pinnedLimit,
      onToggle: () => onPinnedChange(!pinned),
    },
    {
      key: 'featured',
      icon: 'star',
      title: 'تمييز من باقتي',
      subtitle: 'شارة مميزة وأولوية في البحث',
      active: featured,
      enabled: quota.canFeature,
      used: quota.featuredUsed,
      limit: quota.featuredLimit,
      onToggle: () => onFeaturedChange(!featured),
    },
  ];

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, getRtlDirection()]}>
      <View style={styles.headerBlock}>
        <Text style={styles.headerTitle}>مميزات باقتك</Text>
        <Text style={styles.headerSub}>
          {quota.isPaid
            ? 'استخدم حصتك الشهرية بدون دفع إضافي'
            : 'ترقِّ باقتك لتفعيل التثبيت والتمييز'}
        </Text>
      </View>

      {quota.hasPrioritySearch ? (
        <View style={[styles.priorityBanner, getRtlRow()]}>
          <AppIcon name="trending-up-outline" size={16} color={colors.electric} />
          <Text style={styles.priorityText}>
            أولوية في البحث والصفحة الرئيسية مفعّلة لباقتك
          </Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        {options.map((opt) => {
          const disabled = !opt.enabled;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                if (!disabled) opt.onToggle();
              }}
              style={({ pressed }) => [
                styles.card,
                opt.active && styles.cardActive,
                disabled && styles.cardDisabled,
                pressed && !disabled && { opacity: 0.92 },
              ]}
            >
              <View style={[styles.cardTop, getRtlRow()]}>
                <View style={[styles.cardIcon, opt.active && styles.cardIconActive]}>
                  <AppIcon
                    name={opt.icon}
                    size={20}
                    color={opt.active ? colors.electric : colors.textMuted}
                  />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{opt.title}</Text>
                  {!compact ? (
                    <Text style={styles.cardSub}>{opt.subtitle}</Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.toggle,
                    opt.active && styles.toggleActive,
                    disabled && styles.toggleDisabled,
                  ]}
                >
                  {opt.active ? (
                    <AppIcon name="checkmark" size={14} color="#fff" />
                  ) : null}
                </View>
              </View>
              {opt.limit > 0 ? (
                <UsageChip used={opt.used} limit={opt.limit} styles={styles} />
              ) : (
                <Text style={styles.unavailable}>غير متاح في باقتك الحالية</Text>
              )}
            </Pressable>
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
      marginTop: spacing.sm,
    },
    wrapCompact: {
      marginTop: 0,
    },
    headerBlock: {
      gap: 4,
    },
    headerTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      ...getRtlText(),
    },
    headerSub: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 18,
      ...getRtlText(),
    },
    priorityBanner: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: `${colors.electric}10`,
    },
    priorityText: {
      ...typography.caption,
      color: colors.electric,
      flex: 1,
      lineHeight: 18,
      ...getRtlText(),
    },
    grid: {
      gap: spacing.sm,
    },
    card: {
      borderRadius: radius.xl,
      backgroundColor: colors.bgGlass,
      padding: spacing.md,
    },
    cardActive: {
      backgroundColor: `${colors.electric}08`,
    },
    cardDisabled: {
      opacity: 0.55,
    },
    cardTop: {
      alignItems: 'center',
      gap: spacing.md,
    },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgElevated,
    },
    cardIconActive: {
      backgroundColor: `${colors.electric}14`,
    },
    cardInfo: { flex: 1, gap: 2 },
    cardTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      ...getRtlText(),
    },
    cardSub: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 18,
      ...getRtlText(),
    },
    toggle: {
      width: 28,
      height: 28,
      borderRadius: 16,
      backgroundColor: colors.bgDeep,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleActive: {
      backgroundColor: colors.electric,
    },
    toggleDisabled: {
      opacity: 0.5,
    },
    usageChip: {
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
    },
    usageChipText: {
      ...typography.micro,
      color: colors.textMuted,
      fontWeight: '600',
    },
    unavailable: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.sm,
      ...getRtlText(),
    },
  });
}
