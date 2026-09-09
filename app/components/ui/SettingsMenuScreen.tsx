import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { colors, space } from '@/design-system';
import { SarhSettingsRow, SarhSettingsSection } from '@/design-system/components';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type SettingsMenuItem = {
  icon: string;
  label: string;
  route: string;
  value?: string;
};

export type SettingsMenuSection = {
  title: string;
  items: SettingsMenuItem[];
};

type SettingsMenuScreenProps = {
  title: string;
  items?: SettingsMenuItem[];
  sections?: SettingsMenuSection[];
  footerValue?: { label: string; value: string };
  onItemPress?: (item: SettingsMenuItem) => boolean;
};

export function SettingsMenuScreen({
  title,
  items,
  sections,
  footerValue,
  onItemPress,
}: SettingsMenuScreenProps) {
  const router = useRouter();
  const styles = useThemedStyles(() =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background },
      content: { paddingBottom: space[48] },
    }),
  );

  const resolvedSections =
    sections ??
    (items?.length
      ? [
          {
            title: title,
            items,
          },
        ]
      : []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={title} showBack />
      <AppScrollView contentContainerStyle={styles.content}>
        {resolvedSections.map((section) => (
          <SarhSettingsSection key={section.title} title={section.title}>
            {section.items.map((item, index) => (
              <SarhSettingsRow
                key={`${item.route}-${index}`}
                icon={item.icon}
                title={item.label}
                value={item.value}
                showDivider={index < section.items.length - 1}
                onPress={() => {
                  if (onItemPress?.(item)) return;
                  safePush(item.route, undefined, router);
                }}
              />
            ))}
          </SarhSettingsSection>
        ))}
        {footerValue ? (
          <SarhSettingsSection title={footerValue.label}>
            <SarhSettingsRow
              title={footerValue.label}
              value={footerValue.value}
              showDivider={false}
              showChevron={false}
            />
          </SarhSettingsSection>
        ) : null}
      </AppScrollView>
    </SafeAreaView>
  );
}

export default SettingsMenuScreen;
