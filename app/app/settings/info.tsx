import { SettingsMenuScreen, type SettingsMenuItem } from '@/components/ui/SettingsMenuScreen';

const ITEMS: SettingsMenuItem[] = [
  {
    icon: 'information-outline',
    label: 'من نحن',
    subtitle: 'تعرّف على منصة سرح ورسالتها',
    route: '/info/about',
  },
  {
    icon: 'file-document-outline',
    label: 'السياسات والشروط',
    subtitle: 'الشروط، الخصوصية، الملكية الفكرية والدفع',
    route: '/info/policies',
  },
  {
    icon: 'mail-outline',
    label: 'تواصل معنا',
    subtitle: 'قنوات الدعم والتواصل',
    route: '/info/contact',
  },
];

export default function InfoCenterScreen() {
  return (
    <SettingsMenuScreen
      title="مركز المعلومات"
      description="كل ما تحتاج معرفته عن منصة سرح وسياساتها في مكان واحد."
      heroIcon="information-outline"
      items={ITEMS}
    />
  );
}
