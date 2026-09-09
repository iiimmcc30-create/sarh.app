import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { type SidebarNavItem } from '@/components/feature/SidebarMenu';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { colors, space } from '@/design-system';
import { SarhSettingsRow, SarhSettingsSection } from '@/design-system/components';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/design-system/components';
import { motion } from '@/design-system';

type ProfileSettingsMenuScreenProps = {
  title?: string;
  sections: Array<{
    title: string;
    items: SidebarNavItem[];
  }>;
  onLogout: () => void;
};

export function ProfileSettingsMenuScreen({
  title = 'الإعدادات',
  sections,
  onLogout,
}: ProfileSettingsMenuScreenProps) {
  const router = useRouter();
  const styles = useThemedStyles(() =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background },
      content: { paddingBottom: space[48] },
      logout: {
        marginTop: space[32],
        minHeight: space[48],
        paddingHorizontal: space[16],
        justifyContent: 'center',
      },
    }),
  );

  const handleItemPress = (item: SidebarNavItem) => {
    if (item.onPress) {
      item.onPress();
      return;
    }
    if (item.route) {
      safePush(item.route, undefined, router);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={title} showBack />
      <AppScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <SarhSettingsSection key={section.title} title={section.title}>
            {section.items.map((item, index) => (
              <SarhSettingsRow
                key={item.key}
                icon={item.icon}
                title={item.title ?? item.label ?? ''}
                value={item.subtitle}
                showDivider={index < section.items.length - 1}
                onPress={() => handleItemPress(item)}
              />
            ))}
          </SarhSettingsSection>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="تسجيل الخروج"
          onPress={onLogout}
          style={({ pressed }) => [
            styles.logout,
            { opacity: pressed ? motion.opacity.pressed : 1 },
          ]}
        >
          <AppText variant="label" color="danger">
            تسجيل الخروج
          </AppText>
        </Pressable>
      </AppScrollView>
    </SafeAreaView>
  );
}
