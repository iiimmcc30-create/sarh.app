// Powered by OnSpace.AI
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { SidebarMenuItem } from '@/components/ui/SidebarMenuItem';
import { menuCardStyle } from '@/components/feature/SidebarMenu';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { safePush } from '@/lib/safeNavigate';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { sarh } from '@/constants/sarhTokens';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { rtlBackIcon } from '@/lib/rtl';

type SubItem = { icon: string; label: string; route: string };
type Section = { key: string; icon: string; title: string; route: string; items: SubItem[] };

const SECTIONS: Section[] = [
  {
    key: 'account',
    icon: 'account-cog-outline',
    title: 'الحساب',
    route: '/settings/account',
    items: [
      { icon: 'shield-check-outline', label: 'التحقق من الحساب والأمان', route: '/settings/account' },
      { icon: 'lock-outline', label: 'تغيير كلمة المرور والبريد', route: '/settings/account' },
      { icon: 'block', label: 'المحظورين', route: '/settings/blocked' },
    ],
  },
  {
    key: 'info',
    icon: 'information-outline',
    title: 'مركز المعلومات',
    route: '/settings/info',
    items: [
      { icon: 'information-outline', label: 'من نحن', route: '/settings/info' },
      { icon: 'file-document-outline', label: 'الشروط والأحكام', route: '/settings/info' },
      { icon: 'lock-outline', label: 'سياسة الخصوصية', route: '/settings/info' },
      { icon: 'receipt-outline', label: 'سياسة الاسترداد', route: '/settings/info' },
    ],
  },
  {
    key: 'support',
    icon: 'lifebuoy',
    title: 'الدعم والمساعدة',
    route: '/settings/support',
    items: [
      { icon: 'ticket-outline', label: 'تذاكر الدعم', route: '/support/tickets' },
      {
        icon: 'check-decagram-outline',
        label: 'إنشاء طلب توثيق الحسابات',
        route: '/support/verification',
      },
      { icon: 'help-circle-outline', label: 'الأسئلة الشائعة', route: '/support/faq' },
      { icon: 'email-outline', label: 'تواصل معنا', route: '/info/contact' },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles((t) => createStyles(t.colors, t.scheme));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>الإعدادات والخصوصية</Text>
        <View style={styles.headerSpacer} />
      </View>

      <AppScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.intro, menuCardStyle(colors)]}>
          <AppIcon name="shield-check-outline" size={24} color={colors.textPrimary} />
          <View style={styles.introText}>
            <Text style={styles.introTitle}>إدارة تجربتك بأمان</Text>
            <Text style={styles.introSubtitle}>
              تحكم في حسابك وخصوصيتك وطرق التواصل مع الدعم.
            </Text>
          </View>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.key} style={styles.sectionBlock}>
            <SidebarMenuItem
              icon={section.icon}
              title={section.title}
              colors={colors}
              onPress={() => safePush(section.route, undefined, router)}
            />
            {section.items.map((item, idx) => (
              <SidebarMenuItem
                key={`${item.label}-${idx}`}
                icon={item.icon}
                title={item.label}
                colors={colors}
                showDivider={idx < section.items.length - 1}
                onPress={() => safePush(section.route, undefined, router)}
              />
            ))}
          </View>
        ))}
      </AppScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const isDark = scheme === 'dark';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      minHeight: 60,
      backgroundColor: 'transparent',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    backBtn: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      backgroundColor: isDark ? sarh.color.surface : colors.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: isDark ? sarh.color.border : 'transparent',
    },
    headerSpacer: { width: 42, height: 42 },
    headerTitle: { ...typography.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
    scroll: { padding: spacing.lg, paddingBottom: spacing.huge, gap: spacing.lg },
    intro: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
    },
    introText: { flex: 1, gap: spacing.xs },
    introTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    introSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: 19,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    sectionBlock: menuCardStyle(colors),
  });
}
