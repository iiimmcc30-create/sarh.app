import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { colors, space } from '@/design-system';
import { SarhSettingsRow, SarhSettingsSection } from '@/design-system/components';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SECTIONS = [
  {
    title: 'الحساب',
    items: [
      { icon: 'shield-check-outline', label: 'التحقق من الحساب والأمان', route: '/settings/account' },
      { icon: 'lock-outline', label: 'تغيير كلمة المرور والبريد', route: '/settings/account' },
      { icon: 'block', label: 'المحظورين', route: '/settings/blocked' },
    ],
  },
  {
    title: 'مركز المعلومات',
    items: [
      { icon: 'information-outline', label: 'مركز المعلومات', route: '/settings/info' },
      { icon: 'information-outline', label: 'من نحن', route: '/info/about' },
      { icon: 'file-document-outline', label: 'الشروط والأحكام', route: '/info/terms' },
      { icon: 'lock-outline', label: 'سياسة الخصوصية', route: '/info/privacy' },
      { icon: 'receipt-outline', label: 'سياسة الاسترداد', route: '/info/refund' },
      { icon: 'file-document-outline', label: 'السياسات والشروط', route: '/info/policies' },
    ],
  },
  {
    title: 'الدعم والمساعدة',
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
  const styles = useThemedStyles(() =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background },
      content: { paddingBottom: space[48] },
    }),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="الإعدادات" showBack />
      <AppScrollView contentContainerStyle={styles.content}>
        {SECTIONS.map((section) => (
          <SarhSettingsSection key={section.title} title={section.title}>
            {section.items.map((item, index) => (
              <SarhSettingsRow
                key={`${item.label}-${index}`}
                icon={item.icon}
                title={item.label}
                showDivider={index < section.items.length - 1}
                onPress={() => safePush(item.route, undefined, router)}
              />
            ))}
          </SarhSettingsSection>
        ))}
      </AppScrollView>
    </SafeAreaView>
  );
}
