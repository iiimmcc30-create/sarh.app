import { ScreenHeader } from '@/components/layout/ScreenHeader';
import {
  SidebarLogoutButton,
  SidebarMenuRow,
  SidebarSection,
  type SidebarNavItem,
} from '@/components/feature/SidebarMenu';
import { SidebarFooterArt } from '@/components/feature/SidebarFooterArt';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  const handleItemPress = (item: SidebarNavItem) => {
    if (item.onPress) {
      item.onPress();
      return;
    }
    if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={title} showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {sections.map((section) => (
          <SidebarSection key={section.title} title={section.title} colors={colors}>
            {section.items.map((item, index) => (
              <SidebarMenuRow
                key={item.key}
                item={item}
                colors={colors}
                onPress={() => handleItemPress(item)}
                isLast={index === section.items.length - 1}
              />
            ))}
          </SidebarSection>
        ))}

        <SidebarLogoutButton colors={colors} onPress={onLogout} />
        <SidebarFooterArt />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgDeep,
    },
    content: {
      paddingBottom: spacing.lg,
    },
  });
}
