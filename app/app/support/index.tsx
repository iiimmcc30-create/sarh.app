import { SettingsMenuScreen } from '@/components/ui/SettingsMenuScreen';

export default function SupportHubScreen() {
  return (
    <SettingsMenuScreen
      title="الدعم والمساعدة"
      description="تذاكر الدعم، طلب توثيق الحساب، والأسئلة الشائعة"
      heroIcon="lifebuoy"
      items={[
        {
          icon: 'ticket',
          label: 'تذاكر الدعم',
          subtitle: 'إنشاء ومتابعة تذاكر الدعم',
          route: '/support/tickets',
        },
        {
          icon: 'verified',
          label: 'إنشاء طلب توثيق الحسابات',
          subtitle: 'تقديم ومتابعة طلب توثيق الحساب',
          route: '/support/verification',
        },
        {
          icon: 'help-circle',
          label: 'الأسئلة الشائعة',
          subtitle: 'إجابات سريعة عن استخدام التطبيق',
          route: '/support/faq',
        },
      ]}
    />
  );
}
