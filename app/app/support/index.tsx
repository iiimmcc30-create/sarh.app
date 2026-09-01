import { SettingsMenuScreen } from '@/components/ui/SettingsMenuScreen';

export default function SupportHubScreen() {
  return (
    <SettingsMenuScreen
      title="الدعم والمساعدة"
      description="تذاكر الدعم، طلب توثيق الحساب، والأسئلة الشائعة"
      heroIcon="lifebuoy"
      items={[
        {
          icon: 'headset',
          label: 'المساعدة',
          subtitle: 'بلاغ ومساعدة سرحان دون تواصل مع الملحمة',
          route: '/support/help',
        },
        {
          icon: 'ticket-outline',
          label: 'تذاكر الدعم',
          subtitle: 'إنشاء ومتابعة تذاكر الدعم',
          route: '/support/tickets',
        },
        {
          icon: 'shield-check-outline',
          label: 'إنشاء طلب توثيق الحسابات',
          subtitle: 'تقديم ومتابعة طلب توثيق الحساب',
          route: '/support/verification',
        },
        {
          icon: 'help-circle-outline',
          label: 'الأسئلة الشائعة',
          subtitle: 'إجابات سريعة عن استخدام التطبيق',
          route: '/support/faq',
        },
      ]}
    />
  );
}
