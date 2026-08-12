import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { SidebarMenuItem } from '@/components/ui/SidebarMenuItem';
import { menuCardStyle } from '@/components/feature/SidebarMenu';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type SettingsMenuItem = {
  icon: string;
  label: string;
  subtitle?: string;
  route: string;
};

type SettingsMenuScreenProps = {
  title: string;
  description: string;
  heroIcon: string;
  items: SettingsMenuItem[];
  /** Return true to skip default navigation */
  onItemPress?: (item: SettingsMenuItem) => boolean;
};

export function SettingsMenuScreen({
  title,
  description,
  heroIcon,
  items,
  onItemPress,
}: SettingsMenuScreenProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, scheme }) => createStyles(colors, scheme));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={title} showBack />
      <AppScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <AppIcon name={heroIcon} size={28} color={colors.textPrimary} />
          <View style={styles.rtlTextShell}>
            <Text style={styles.heroTitle}>{title}</Text>
          </View>
          <View style={styles.rtlTextShell}>
            <Text style={styles.heroDescription}>{description}</Text>
          </View>
        </View>

        <View style={styles.list}>
          {items.map((item, index) => (
            <SidebarMenuItem
              key={`${item.route}-${index}`}
              icon={item.icon}
              title={item.label}
              subtitle={item.subtitle}
              showDivider={index < items.length - 1}
              colors={colors}
              onPress={() => {
                if (onItemPress?.(item)) return;
                safePush(item.route, undefined, router);
              }}
            />
          ))}
        </View>
      </AppScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, _scheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.huge,
      gap: spacing.lg,
    },
    hero: {
      alignItems: 'center',
      padding: spacing.xl,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
      gap: spacing.sm,
    },
    /** Physical LTR shell — same as listing title / SidebarMenuItem. */
    rtlTextShell: {
      width: '100%',
      direction: 'ltr',
    },
    heroTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    heroDescription: {
      ...typography.caption,
      color: colors.textSecondary,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
      lineHeight: 20,
      marginTop: spacing.xs,
    },
    list: menuCardStyle(colors),
  });
}

export default SettingsMenuScreen;
