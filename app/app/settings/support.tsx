import { SettingsMenuScreen } from '@/components/ui/SettingsMenuScreen';

export default function SupportScreen() {
  return (
    <SettingsMenuScreen
      title="الدعم والمساعدة"
      description="تذاكر الدعم، طلب توثيق الحساب، والأسئلة الشائعة"
      heroIcon="lifebuoy"
      items={[
        {
          icon: 'lifebuoy',
          label: 'مركز الدعم والمساعدة',
          subtitle: 'تذاكر الدعم • التوثيق • الأسئلة الشائعة',
          route: '/support',
        },
        {
          icon: 'phone',
          label: 'تواصل معنا',
          subtitle: 'هاتف • واتساب • بريد',
          route: '/info/contact',
        },
      ]}
    />
  );
}
