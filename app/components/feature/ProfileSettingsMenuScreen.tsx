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
import { AppScrollView } from '@/components/ui/AppScrollView';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
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
      safePush(item.route, undefined, router);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={title} showBack />
      <AppScrollView contentContainerStyle={styles.content}>
        <View style={styles.sections}>
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
        </View>

        <SidebarLogoutButton colors={colors} onPress={onLogout} />
        <SidebarFooterArt />
      </AppScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.screenRoot,
    },
    content: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.xxl,
    },
    sections: {
      gap: 0,
    },
  });
}
