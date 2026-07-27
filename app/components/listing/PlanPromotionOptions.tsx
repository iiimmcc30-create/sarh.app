import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { usePlanPromotionQuota } from '@/hooks/usePlanPromotionQuota';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { rtlDirection, rtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type PlanPromotionOptionsProps = {
  featured: boolean;
  pinned: boolean;
  onFeaturedChange: (value: boolean) => void;
  onPinnedChange: (value: boolean) => void;
  compact?: boolean;
};

type OptionKey = 'featured' | 'pinned';

function UsagePill({
  used,
  limit,
  styles,
}: {
  used: number;
  limit: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const remaining = limit > 0 ? Math.max(0, limit - used) : 0;
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0;

  return (
    <View style={styles.pillWrap}>
      <View style={styles.pillTrack}>
        <View style={[styles.pillFill, { width: `${ratio * 100}%` }]} />
      </View>
      <Text style={styles.pillText}>
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
    emoji: string;
    title: string;
    subtitle: string;
    active: boolean;
    enabled: boolean;
    used: number;
    limit: number;
    gradient: [string, string];
    onToggle: () => void;
  }> = [
    {
      key: 'pinned',
      icon: 'pin',
      emoji: '📌',
      title: 'تثبيت من باقتي',
      subtitle: 'يظهر في أعلى قائمة الإعلانات',
      active: pinned,
      enabled: quota.canPin,
      used: quota.pinnedUsed,
      limit: quota.pinnedLimit,
      gradient: [colors.electric, colors.electricBright],
      onToggle: () => onPinnedChange(!pinned),
    },
    {
      key: 'featured',
      icon: 'star',
      emoji: '⭐',
      title: 'تمييز من باقتي',
      subtitle: 'شارة مميزة وأولوية في البحث',
      active: featured,
      enabled: quota.canFeature,
      used: quota.featuredUsed,
      limit: quota.featuredLimit,
      gradient: [colors.gold, '#FFE566'],
      onToggle: () => onFeaturedChange(!featured),
    },
  ];

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, rtlDirection]}>
      <View style={[styles.headerRow, rtlRow]}>
        <LinearGradient colors={gradientsHeader(colors)} style={styles.headerIcon}>
          <AppIcon name="diamond-outline" size={18} color="#fff" />
        </LinearGradient>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>مميزات باقتك</Text>
          <Text style={styles.headerSub}>
            {quota.isPaid
              ? 'استخدم حصتك الشهرية بدون دفع إضافي'
              : 'ترقِّ باقتك لتفعيل التثبيت والتمييز'}
          </Text>
        </View>
      </View>

      {quota.hasPrioritySearch ? (
        <View style={[styles.priorityBanner, rtlRow]}>
          <AppIcon name="trending-up-outline" size={16} color={colors.emerald} />
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
              {opt.active ? (
                <LinearGradient
                  colors={[`${opt.gradient[0]}33`, `${opt.gradient[1]}18`]}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              <View style={[styles.cardTop, rtlRow]}>
                <LinearGradient colors={opt.gradient} style={styles.cardIcon}>
                  <Text style={styles.cardEmoji}>{opt.emoji}</Text>
                </LinearGradient>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{opt.title}</Text>
                  {!compact ? (
                    <Text style={styles.cardSub}>{opt.subtitle}</Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.toggle,
                    opt.active && { backgroundColor: opt.gradient[0] },
                    disabled && styles.toggleDisabled,
                  ]}
                >
                  {opt.active ? (
                    <AppIcon name="checkmark" size={14} color="#fff" />
                  ) : null}
                </View>
              </View>
              {opt.limit > 0 ? (
                <UsagePill used={opt.used} limit={opt.limit} styles={styles} />
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

function gradientsHeader(colors: ThemeColors): [string, string] {
  return [colors.electric, colors.electricBright];
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
    headerRow: {
      alignItems: 'center',
      gap: spacing.md,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1, gap: 2 },
    headerTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    headerSub: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 18,
    },
    priorityBanner: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: `${colors.emerald}14`,
      borderWidth: 1,
      borderColor: `${colors.emerald}30`,
    },
    priorityText: {
      ...typography.caption,
      color: colors.emerald,
      flex: 1,
      lineHeight: 18,
    },
    grid: {
      gap: spacing.sm,
    },
    card: {
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.bgGlass,
      padding: spacing.md,
      overflow: 'hidden',
    },
    cardActive: {
      borderColor: colors.electricBright,
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
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardEmoji: { fontSize: 20 },
    cardInfo: { flex: 1, gap: 2 },
    cardTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    cardSub: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 18,
    },
    toggle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.bgDeep,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleDisabled: {
      borderColor: colors.borderSoft,
    },
    pillWrap: {
      marginTop: spacing.sm,
      gap: spacing.xs,
    },
    pillTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderSoft,
      overflow: 'hidden',
    },
    pillFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: colors.electricBright,
    },
    pillText: {
      ...typography.micro,
      color: colors.textMuted,
    },
    unavailable: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
  });
}
