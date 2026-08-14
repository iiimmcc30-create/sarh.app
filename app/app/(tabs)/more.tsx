import { AppIcon } from '@/components/ui/FlaticonIcon';
import { SidebarMenuItem } from '@/components/ui/SidebarMenuItem';
import { SidebarThemeToggle, menuCardStyle } from '@/components/feature/SidebarMenu';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { ds } from '@/constants/designSystem';
import { LOCALE_STORAGE_KEY, type AppLocale, normalizeAppLocale } from '@/lib/locale';
import { setupRtl } from '@/lib/rtl';
import { safePush } from '@/lib/safeNavigate';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  DevSettings,
  I18nManager,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TAB_CLEARANCE = ds.tabBar.height + ds.tabBar.fabLift + ds.space.xxl + 24;

const APP_STORE_URL = 'https://apps.apple.com/app/id0000000000';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.safat.app';
import { Platform } from 'react-native';

function openStoreRating() {
  const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
  Linking.openURL(url).catch(() => {});
}

export default function MoreScreen() {
  const router = useRouter();
  const { preference, setPreference, colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [locale, setLocale] = useState<AppLocale>('ar');

  useEffect(() => {
    void AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((v) => {
      setLocale(normalizeAppLocale(v));
    });
  }, []);

  const onToggleTheme = useCallback(() => {
    void setPreference(preference === 'dark' ? 'light' : 'dark');
  }, [preference, setPreference]);

  const onSelectLocale = useCallback(
    async (next: AppLocale) => {
      if (next === locale) return;
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
      setLocale(next);
      const needsRtl = next === 'ar';
      if (I18nManager.isRTL !== needsRtl) {
        setupRtl(next);
        Alert.alert(
          'تغيير اللغة',
          'سيتم تطبيق اتجاه الواجهة بعد إعادة تشغيل التطبيق.',
          [
            {
              text: 'حسنًا',
              onPress: () => {
                try {
                  DevSettings.reload();
                } catch {
                  /* cold start will apply */
                }
              },
            },
          ],
        );
      }
    },
    [locale],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.rtlTextShell}>
          <Text style={styles.headerTitle}>المزيد</Text>
        </View>
        <View style={styles.rtlTextShell}>
          <Text style={styles.headerSub}>الخدمات واللغة والسياسات</Text>
        </View>
      </View>

      <AppScrollView contentContainerStyle={styles.content}>
        {/* الخدمات: المظهر + خدمات الوزارة في بطاقة واحدة */}
        <SidebarThemeToggle
          preference={preference}
          colors={colors}
          onToggle={onToggleTheme}
          title="الخدمات"
          headerIcon="briefcase-outline"
          themeLabel="المظهر"
          footer={
            <SidebarMenuItem
              icon="briefcase-outline"
              title="خدمات وزارة البيئة والمياه والزراعة"
              colors={colors}
              showDivider={false}
              onPress={() => safePush('/sarh-services', undefined, router)}
            />
          }
        />

        {/* اللغة */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.coverTrail}>
              <View style={styles.rtlTextShellFlex}>
                <Text style={styles.cardTitle}>اللغة</Text>
              </View>
              <AppIcon name="globe-outline" size={22} color={colors.textPrimary} />
            </View>
          </View>
          <View style={styles.langTrack}>
            <Pressable
              onPress={() => void onSelectLocale('ar')}
              style={[styles.langOption, locale === 'ar' && styles.langOptionActive]}
            >
              <Text style={[styles.langText, locale === 'ar' && styles.langTextActive]}>عربي</Text>
            </Pressable>
            <Pressable
              onPress={() => void onSelectLocale('en')}
              style={[styles.langOption, locale === 'en' && styles.langOptionActive]}
            >
              <Text style={[styles.langText, locale === 'en' && styles.langTextActive]}>ENGLISH</Text>
            </Pressable>
          </View>
        </View>

        {/* السياسات والشروط */}
        <View style={styles.sectionLabelWrap}>
          <View style={styles.rtlTextShell}>
            <Text style={styles.sectionLabel}>السياسات والشروط</Text>
          </View>
        </View>
        <View style={styles.card}>
          <SidebarMenuItem
            icon="file-document-outline"
            title="السياسات والشروط"
            colors={colors}
            showDivider={false}
            onPress={() => safePush('/info/policies', undefined, router)}
          />
        </View>

        {/* عن سرح */}
        <View style={styles.sectionLabelWrap}>
          <View style={styles.rtlTextShell}>
            <Text style={styles.sectionLabel}>عن سرح</Text>
          </View>
        </View>
        <View style={styles.card}>
          <SidebarMenuItem
            icon="information-outline"
            title="من نحن"
            colors={colors}
            showDivider
            onPress={() => safePush('/info/about', undefined, router)}
          />
          <SidebarMenuItem
            icon="mail-outline"
            title="تواصل معنا"
            colors={colors}
            showDivider
            onPress={() => safePush('/info/contact', undefined, router)}
          />
          <SidebarMenuItem
            icon="star-outline"
            title="تقييم التطبيق"
            colors={colors}
            showDivider={false}
            onPress={openStoreRating}
          />
        </View>
      </AppScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.screenRoot },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      gap: spacing.xs,
    },
    /** Physical LTR shell — same as SidebarMenuItem. */
    rtlTextShell: {
      width: '100%',
      direction: 'ltr',
    },
    rtlTextShellFlex: {
      flex: 1,
      direction: 'ltr',
    },
    headerTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    headerSub: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_CLEARANCE,
      gap: spacing.lg,
    },
    card: menuCardStyle(colors),
    cardHeader: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    coverTrail: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
      width: '100%',
    },
    cardTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    langTrack: {
      flexDirection: 'row-reverse',
      backgroundColor: colors.bgDeep,
      borderRadius: 12,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      padding: 4,
      gap: 4,
    },
    langOption: {
      flex: 1,
      minHeight: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    langOptionActive: {
      backgroundColor: colors.electric,
    },
    langText: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
    },
    langTextActive: {
      color: '#FFFFFF',
    },
    sectionLabelWrap: {
      marginTop: spacing.xs,
      paddingHorizontal: spacing.lg,
    },
    sectionLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
  });
}
