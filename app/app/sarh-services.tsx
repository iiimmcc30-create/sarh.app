import { AppIcon } from '@/components/ui/FlaticonIcon';
import { OfficialServiceCard } from '@/components/feature/OfficialServiceCard';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlText, getRtlRow, getRtlDirection } from '@/lib/rtl';
import {
  fetchOfficialServices,
  groupOfficialServicesByCategory,
} from '@/services/officialServices';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SarhServicesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState(
    [] as ReturnType<typeof groupOfficialServicesByCategory>,
  );

  const load = useCallback(async () => {
    setError(null);
    const { services } = await fetchOfficialServices();
    if (services.length === 0) {
      setError('لا توجد خدمات متاحة حالياً.');
      setGroups([]);
      return;
    }
    setGroups(groupOfficialServicesByCategory(services));
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="خدمات سرح" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, getRtlDirection()]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.electricBright}
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>خدمات سرح</Text>
          <Text style={styles.heroSubtitle}>
            دليل للخدمات الرسمية التابعة لوزارة البيئة والمياه والزراعة
          </Text>
        </View>

        <View style={styles.notice}>
          <AppIcon name="information-circle-outline" size={18} color={colors.electricBright} />
          <Text style={styles.noticeText}>
            تطبيق سرح يعرض معلومات الخدمة فقط ولا ينشئ طلبات ولا يخزن بياناتك.
            عند الضغط على «طلب الخدمة» يُفتح الرابط الرسمي في المتصفح.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.electricBright} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void load()} style={styles.retryBtn}>
              <Text style={styles.retryText}>إعادة المحاولة</Text>
            </Pressable>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.category} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {group.emoji} {group.label}
              </Text>
              <View style={styles.sectionList}>
                {group.items.map((service) => (
                  <OfficialServiceCard key={service.id} service={service} />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgDeep },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.huge,
      gap: spacing.lg,
    },
    hero: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    heroTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    heroSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      writingDirection: 'rtl',
    },
    notice: {
      ...getRtlRow(),
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.bgGlassStrong,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    noticeText: {
      ...typography.caption,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
      ...getRtlText(),
      ...getRtlText(),
    },
    loader: { marginTop: spacing.xl },
    errorBox: {
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.xl,
    },
    errorText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    retryBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    retryText: {
      ...typography.caption,
      color: colors.electricBright,
      fontWeight: '700',
    },
    section: { gap: spacing.md },
    sectionTitle: {
      ...typography.h3,
      color: colors.textBrandStrong,
      ...getRtlText(),
      ...getRtlText(),
    },
    sectionList: { gap: spacing.md },
  });
}
