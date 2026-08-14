import { menuCardStyle } from '@/components/feature/SidebarMenu';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { OfficialServiceCard } from '@/components/feature/OfficialServiceCard';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { MEWA_LOGO } from '@/constants/branding';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  fetchOfficialServices,
  groupOfficialServicesByCategory,
} from '@/services/officialServices';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SarhServicesScreen() {
  const { colors, scheme } = useTheme();
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
      <ScreenHeader title="الخدمات" showBack />

      <AppScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.electricBright}
          />
        }
      >
        <View style={[styles.hero, menuCardStyle(colors)]}>
          <View style={[styles.logoPlate, scheme === 'dark' && styles.logoPlateDark]}>
            <Image
              source={MEWA_LOGO}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="شعار وزارة البيئة والمياه والزراعة"
            />
          </View>
          <Text style={styles.heroTitle}>خدمات وزارة البيئة والمياه والزراعة</Text>
          <Text style={styles.heroSubtitle}>
            دليل الخدمات الرسمية للوزارة — يفتح الرابط الرسمي في المتصفح عند الضغط
          </Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            تطبيق سرح يعرض معلومات الخدمة فقط ولا ينشئ طلبات ولا يخزن بياناتك.
            عند الضغط على الخدمة يُفتح الرابط الرسمي في المتصفح.
          </Text>
          <View style={styles.noticeIcon}>
            <AppIcon name="information-circle-outline" size={18} color={colors.electricBright} />
          </View>
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
              <View style={[styles.sectionList, menuCardStyle(colors)]}>
                {group.items.map((service, index) => (
                  <OfficialServiceCard
                    key={service.id}
                    service={service}
                    showDivider={index < group.items.length - 1}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </AppScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.huge,
      gap: spacing.lg,
    },
    hero: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    logoPlate: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
    },
    logoPlateDark: {
      backgroundColor: 'transparent',
    },
    logo: {
      width: 260,
      height: 64,
    },
    heroTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    heroSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      writingDirection: 'rtl',
    },
    notice: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
    },
    noticeIcon: {
      width: 28,
      alignItems: 'center',
      paddingTop: 2,
      flexShrink: 0,
    },
    noticeText: {
      ...typography.caption,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
      textAlign: 'right',
      writingDirection: 'rtl',
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
      backgroundColor: colors.bgElevated,
    },
    retryText: {
      ...typography.caption,
      color: colors.electricBright,
      fontWeight: '600',
    },
    section: { gap: spacing.sm },
    sectionTitle: {
      ...typography.caption,
      fontWeight: '600',
      fontSize: 12,
      letterSpacing: 0.4,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
      paddingHorizontal: 4,
    },
    sectionList: {
      overflow: 'hidden',
    },
  });
}
