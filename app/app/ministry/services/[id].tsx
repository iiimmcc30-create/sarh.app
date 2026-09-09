import { AppIcon } from '@/components/ui/FlaticonIcon';
import { AppText } from '@/components/ui/AppText';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow, rtlForwardIcon } from '@/lib/rtl';
import {
  OFFICIAL_SERVICE_CATEGORY_META,
  fetchOfficialService,
  fetchOfficialServices,
  resolveServiceChannel,
  resolveServiceFeeLabel,
  splitServiceLines,
  type OfficialService,
} from '@/services/officialServices';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';

type DetailTab = 'steps' | 'conditions' | 'documents';

const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: 'steps', label: 'الخطوات' },
  { key: 'conditions', label: 'الشروط' },
  { key: 'documents', label: 'المستندات المطلوبة' },
];

export default function MinistryServiceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [service, setService] = useState<OfficialService | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<DetailTab>('steps');

  const load = useCallback(async () => {
    if (!id) {
      setService(null);
      return;
    }
    const direct = await fetchOfficialService(id);
    if (direct) {
      setService(direct);
      return;
    }
    const { services } = await fetchOfficialServices();
    setService(services.find((item) => item.id === id) ?? null);
  }, [id]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const categoryLabel = useMemo(() => {
    if (!service) return '';
    return OFFICIAL_SERVICE_CATEGORY_META[service.category]?.label ?? service.category;
  }, [service]);

  const channel = service ? resolveServiceChannel(service) : null;
  const feeLabel = service ? resolveServiceFeeLabel(service) : null;
  const tabLines = service
    ? splitServiceLines(
        tab === 'steps' ? service.steps : tab === 'conditions' ? service.conditions : service.documents,
      )
    : [];

  const startService = () => {
    const url = service?.externalUrl?.trim();
    if (!url) return;
    void Linking.openURL(url);
  };

  const tabBody =
    tabLines.length > 0 ? tabLines.join('\n') : 'لا توجد بيانات لهذه الخانة في النظام حالياً.';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="تفاصيل الخدمة" showBack />
      {loading ? (
        <ActivityIndicator color={colors.electricBright} style={styles.loader} />
      ) : !service ? (
        <View style={styles.empty}>
          <AppText style={styles.emptyText}>تعذّر العثور على الخدمة</AppText>
        </View>
      ) : (
        <AppScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <AppText style={styles.title}>{service.title}</AppText>
            {categoryLabel ? (
              <View style={[styles.catBadge, getRtlRow()]}>
                <AppText style={styles.catText}>{categoryLabel}</AppText>
              </View>
            ) : null}
            {service.description ? (
              <AppText style={styles.desc}>{service.description}</AppText>
            ) : null}
            {service.externalUrl ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="بدء الخدمة"
                onPress={startService}
                style={({ pressed }) => [styles.startBtn, getRtlRow(), pressed && styles.pressed]}
              >
                <AppText style={styles.startText}>بدء الخدمة</AppText>
                <AppIcon name={rtlForwardIcon()} size={16} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.metaCard}>
            {feeLabel ? <MetaRow styles={styles} label="رسوم الخدمة" value={feeLabel} /> : null}
            {channel ? <MetaRow styles={styles} label="قناة تقديم الخدمة" value={channel} /> : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabStrip, getRtlRow()]}
          >
            {DETAIL_TABS.map((item) => {
              const active = tab === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setTab(item.key)}
                  style={styles.tabChip}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <AppText style={[styles.tabLabel, active && styles.tabLabelOn]}>
                    {item.label}
                  </AppText>
                  {active ? <View style={styles.tabLine} /> : <View style={styles.tabLineOff} />}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.tabCard}>
            <AppText style={styles.tabBody}>{tabBody}</AppText>
          </View>
        </AppScrollView>
      )}
    </SafeAreaView>
  );
}

function MetaRow({
  styles,
  label,
  value,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaRow}>
      <AppText style={styles.metaLabel}>{label}</AppText>
      <AppText style={styles.metaValue}>{value}</AppText>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    loader: { marginTop: spacing.xxl },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    emptyText: {
      ...typography.body,
      color: colors.textMuted,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.huge,
      gap: spacing.md,
    },
    heroCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
      shadowColor: '#07131C',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    catBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(32, 182, 111, 0.12)',
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    catText: {
      ...typography.caption,
      color: colors.electric,
      fontWeight: '600',
    },
    desc: {
      ...typography.feedBody,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    startBtn: {
      marginTop: spacing.sm,
      backgroundColor: colors.electric,
      borderRadius: radius.md,
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    startText: {
      ...typography.body,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    metaCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
    },
    metaRow: {
      gap: 4,
    },
    metaLabel: {
      ...typography.caption,
      color: colors.textMuted,
    },
    metaValue: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    tabStrip: {
      gap: spacing.lg,
      paddingHorizontal: 2,
    },
    tabChip: {
      alignItems: 'center',
      paddingTop: 4,
    },
    tabLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
    },
    tabLabelOn: {
      color: colors.electric,
    },
    tabLine: {
      marginTop: 8,
      height: 2,
      width: '80%',
      backgroundColor: colors.electric,
      borderRadius: 2,
    },
    tabLineOff: {
      marginTop: 8,
      height: 2,
    },
    tabCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.lg,
    },
    tabBody: {
      ...typography.feedBody,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    pressed: {
      opacity: 0.92,
    },
  });
}
