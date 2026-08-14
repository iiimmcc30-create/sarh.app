// Powered by OnSpace.AI
// SAFAT — Butcher Analytics Dashboard (لوحة التحليلات - للجزار الموثّق)
import { AppIcon } from '@/components/ui/FlaticonIcon';

import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { gradients, radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useButcherStats, StatsPeriod } from '@/hooks/useButcherStats';
import { usePaidServices } from '@/hooks/usePaidServices';

type Period = StatsPeriod;

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const chart = useThemedStyles(() => createChartStyles());
  const MAX_BARS = 14;
  const slice = data.slice(-MAX_BARS);
  const max = Math.max(...slice, 1);
  const BAR_H = 60;

  return (
    <View style={chart.wrap}>
      {slice.map((v, i) => (
        <View key={i} style={chart.barWrap}>
          <LinearGradient
            colors={[color, color + '88']}
            style={[chart.bar, { height: Math.max(4, (v / max) * BAR_H) }]}
          />
        </View>
      ))}
    </View>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, color, trend,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color: string;
  trend?: { value: number; positive: boolean };
}) {
  const { colors } = useTheme();
  const sc = useThemedStyles(({ colors }) => createStatCardStyles(colors));
  return (
    <View style={sc.card}>
      <View style={[sc.iconWrap, { backgroundColor: color + '22' }]}>
        <AppIcon name={icon} size={16} color={color} />
      </View>
      <Text style={sc.label}>{label}</Text>
      <Text style={[sc.value, { color: colors.textPrimary }]}>{value}</Text>
      {sub && <Text style={sc.sub}>{sub}</Text>}
      {trend && (
        <View style={sc.trendRow}>
          <AppIcon
            name={trend.positive ? 'trending-up' : 'trending-down'}
            size={14}
            color={trend.positive ? colors.success : colors.danger}
          />
          <Text style={[sc.trendText, { color: trend.positive ? colors.textBrandSuccess : colors.danger }]}>
            {trend.value}%
          </Text>
        </View>
      )}
    </View>
  );
}

function trendProp(value: number | null | undefined) {
  if (value === null || value === undefined) return undefined;
  return { value: Math.abs(value), positive: value >= 0 };
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ButcherDashboardScreen() {
  const router = useRouter();
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const { accessToken } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const { stats, loading, error } = useButcherStats(accessToken, period);
  const { hasAnyBoostService } = usePaidServices();

  const data = stats ?? {
    revenue: 0,
    orders: 0,
    profileViews: 0,
    completionRate: 0,
    avgOrderValue: 0,
    newCustomers: 0,
    dailyRevenue: [0],
    topProducts: [] as { name: string; sales: number; revenue: number }[],
    reviews: { avg: 0, count: 0 },
    trends: { revenue: null, orders: null, profileViews: null, completionRate: null },
    butcher: { nameAr: 'ملحمتي الخاصة', subscriptionActive: false },
  };

  const PERIODS: { id: Period; label: string }[] = [
    { id: 'week', label: 'الأسبوع' },
    { id: 'month', label: 'الشهر' },
    { id: '3months', label: 'مخصص' },
  ];

  const butcherId = stats?.butcher?.id;

  const quickActions: {
    icon: string;
    label: string;
    color: string;
    onPress: () => void;
  }[] = [
    {
      icon: 'storefront-outline',
      label: 'عرض ملفي',
      color: colors.electric,
      onPress: () => {
        if (butcherId) {
          router.push({ pathname: '/butchers/[id]', params: { id: butcherId } });
        } else {
          router.push('/(butcher)/profile');
        }
      },
    },
    {
      icon: 'add-circle-outline',
      label: 'إضافة منتج',
      color: colors.success,
      onPress: () => router.push({
        pathname: '/(butcher)/manage',
        params: { tab: 'products', action: 'add' },
      }),
    },
    {
      icon: 'pricetag-outline',
      label: 'إضافة عرض',
      color: colors.amber,
      onPress: () => router.push({
        pathname: '/(butcher)/manage',
        params: { tab: 'offers', action: 'add' },
      }),
    },
    {
      icon: 'camera-outline',
      label: 'نشر قصة',
      color: colors.rose,
      onPress: () => router.push({ pathname: '/create/story', params: { mode: 'butcher' } }),
    },
    {
      icon: 'chatbubbles-outline',
      label: 'الرسائل',
      color: colors.cyan,
      onPress: () => router.push('/(butcher)/messages'),
    },
    ...(hasAnyBoostService
      ? [
          {
            icon: 'megaphone-outline',
            label: 'الترويج',
            color: colors.gold,
            onPress: () => router.push('/promote'),
          },
        ]
      : []),
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/butcher-sidebar')} hitSlop={12} style={styles.backBtn}>
          <AppIcon name="menu" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>لوحة التحليلات</Text>
          <Text style={styles.headerSub}>{data.butcher.nameAr}</Text>
        </View>
        <Pressable style={styles.exportBtn}>
          <AppIcon name="file-export-outline" size={20} color={colors.electricBright} />
        </Pressable>
      </View>

      {/* Status strip */}
      <View style={styles.verifiedStrip}>
        <LinearGradient colors={[colors.electric + '18', colors.electric + '08']} style={StyleSheet.absoluteFill} />
        <AppIcon name="storefront-outline" size={16} color={colors.electric} />
        <Text style={styles.verifiedStripText}>
          {data.butcher.nameAr} · حساب ملحمة نشط
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {loading && (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.electricBright} />
          </View>
        )}

        {error && !loading && (
          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, ...typography.body }}>تعذر تحميل الإحصائيات</Text>
          </View>
        )}

        {/* Period Tabs */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setPeriod(p.id)}
              style={[styles.periodBtn, period === p.id && styles.periodBtnActive]}
            >
              <Text style={[styles.periodLabel, period === p.id && styles.periodLabelActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.revenueCard}>
          <View style={styles.revenueTop}>
            <View>
              <Text style={styles.revenueLabel}>إجمالي المبيعات</Text>
              <Text style={styles.revenueValue}>
                {data.revenue.toLocaleString()} ر.س
              </Text>
            </View>
            {data.trends.revenue !== null && (
              <View style={styles.revenueTrend}>
                <AppIcon name="trending-up" size={16} color="#20B66F" />
                <Text style={styles.revenueTrendText}>
                  {data.trends.revenue >= 0 ? '+' : ''}{data.trends.revenue}%
                </Text>
              </View>
            )}
          </View>
          <MiniBarChart data={data.dailyRevenue} color="#20B66F" />
          <Text style={styles.revenueChartLabel}>
            {period === 'week' ? 'آخر ٧ أيام' : period === 'month' ? 'آخر ٣٠ يوماً' : 'آخر ٩٠ يوماً'}
          </Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="bag-outline"
            label="عدد الطلبات"
            value={data.orders.toString()}
            color={colors.electricBright}
            trend={trendProp(data.trends.orders)}
          />
          <StatCard
            icon="cash-multiple"
            label="متوسط قيمة الطلب"
            value={`${data.avgOrderValue} ر.س`}
            color={colors.textSecondary}
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="نسبة الإتمام"
            value={`${data.completionRate}%`}
            color={colors.success}
          />
          <StatCard
            icon="eye-outline"
            label="مشاهدات الملف"
            value={data.profileViews.toLocaleString()}
            color={colors.cyan}
          />
          <StatCard
            icon="star-outline"
            label="التقييم"
            value={data.reviews.avg.toString()}
            sub={`${data.reviews.count} تقييم`}
            color={colors.amber}
          />
          <StatCard
            icon="person-outline"
            label="عملاء جدد"
            value={data.newCustomers.toString()}
            color={colors.textSecondary}
          />
        </View>

        {/* Top products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>أكثر المنتجات مبيعاً</Text>
          {data.topProducts.length === 0 ? (
            <Text style={{ color: colors.textMuted, ...typography.caption, textAlign: 'center', paddingVertical: spacing.lg }}>
              لا توجد مبيعات في هذه الفترة
            </Text>
          ) : (
          data.topProducts.map((p, i) => {
            const maxRevenue = data.topProducts[0]?.revenue || 1;
            const pct = (p.revenue / maxRevenue) * 100;
            return (
              <View key={i} style={styles.productRow}>
                <View style={styles.productRank}>
                  <Text style={styles.productRankText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.productNameRow}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Text style={styles.productSales}>{p.sales} طلب</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <LinearGradient
                      colors={[colors.electric, colors.cyan]}
                      style={[styles.progressFill, { width: `${pct}%` }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <Text style={styles.productRevenue}>{p.revenue.toLocaleString()} ر.س</Text>
                </View>
              </View>
            );
          })
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, i) => (
              <Pressable
                key={i}
                onPress={action.onPress}
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: action.color + '22' }]}>
                  <AppIcon name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenRoot },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgGlass,
    borderWidth: 1, borderColor: colors.borderSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  headerSub: { ...typography.caption, color: colors.textBrand, marginTop: 1 },
  exportBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgGlass,
    borderWidth: 1, borderColor: colors.borderSoft,
    alignItems: 'center', justifyContent: 'center',
  },

  verifiedStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.gold + '44',
    overflow: 'hidden',
    position: 'relative',
  },
  verifiedStripText: { ...typography.caption, color: colors.gold, flex: 1 },
  manageBtn: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.gold + '33',
    borderWidth: 1, borderColor: colors.gold + '66',
  },
  manageBtnText: { ...typography.micro, color: colors.gold, fontWeight: '600' },

  periodRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: spacing.lg,
  },
  periodBtn: {
    flex: 1, paddingVertical: 9,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: colors.electric },
  periodLabel: { ...typography.caption, color: colors.textMuted },
  periodLabelActive: { color: '#fff', fontWeight: '600' },

  revenueCard: {
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150,175,185,0.18)',
  },
  revenueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  revenueLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },
  revenueValue: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4, textAlign: 'right' },
  revenueTrend: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(32,182,111,0.14)',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: radius.pill,
  },
  revenueTrendText: { ...typography.caption, color: '#20B66F', fontWeight: '600' },
  revenueChartLabel: { ...typography.micro, color: colors.textMuted, textAlign: 'center' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },

  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.md,
  },
  productRank: {
    width: 28, height: 28, borderRadius: 16,
    backgroundColor: colors.electric + '33',
    alignItems: 'center', justifyContent: 'center',
  },
  productRankText: { ...typography.caption, color: colors.textBrandStrong, fontWeight: '600' },
  productNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  productName: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  productSales: { ...typography.micro, color: colors.textMuted },
  progressTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  productRevenue: { ...typography.micro, color: colors.gold, fontWeight: '600' },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionBtn: {
    width: '30%',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingVertical: spacing.lg,
  },
  actionIconWrap: {
    width: 44, height: 44, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { ...typography.micro, color: colors.textSecondary, textAlign: 'center' },

  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.gold + '44',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.lg,
  },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rankIcon: { fontSize: 32 },
  rankTitle: { ...typography.bodyStrong, color: colors.gold },
  rankSub: { ...typography.micro, color: colors.textMuted, marginTop: 3, maxWidth: 220 },
  rankBadge: {
    width: 56, height: 56, borderRadius: 20,
    backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  rankNum: { fontSize: 22, fontWeight: '600', color: '#1A1300' },
  });
}

function createStatCardStyles(colors: ThemeColors) {
  return StyleSheet.create({
  card: {
    width: '47%',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150,175,185,0.18)',
    padding: spacing.md,
    gap: 4,
    backgroundColor: colors.bgElevated,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  icon: { fontSize: 18 },
  label: { ...typography.micro, color: colors.textMuted },
  value: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  sub: { ...typography.micro, color: colors.textMuted },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  trendText: { ...typography.micro, fontWeight: '600' },
  });
}

function createChartStyles() {
  return StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 68,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 68,
  },
  bar: {
    width: '100%',
    borderRadius: 3,
    minHeight: 4,
  },
  });
}
