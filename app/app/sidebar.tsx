// Powered by OnSpace.AI
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  scrimColor,
  spacing,
  panelSurfaceBg,
  type ThemeColors,
} from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { alignInlineEnd, borderInlineEnd, getRtlDirection, getRtlRow } from '@/lib/rtl';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarFooterArt } from '@/components/feature/SidebarFooterArt';
import { confirmSignOut } from '@/lib/confirmSignOut';
import {
  SidebarLogoutButton,
  SidebarMenuRow,
  SidebarThemeToggle,
  type SidebarMenuItem,
} from '@/components/feature/SidebarMenu';

type MenuItem = SidebarMenuItem;

export default function SidebarScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { preference, setPreference, colors } = useTheme();
  const styles = useThemedStyles((theme) => createSidebarStyles(theme.colors, theme.scheme));

  const handleNav = (route: string) => {
    router.back();
    setTimeout(() => router.push(route as any), 120);
  };

  const handleSignOut = () => {
    confirmSignOut(async () => {
      router.back();
      await signOut();
      setTimeout(() => router.replace('/auth/phone' as any), 300);
    });
  };

  const toggleTheme = () => {
    setPreference(preference === 'dark' ? 'light' : 'dark');
  };

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        key: 'profile',
        icon: 'user',
        label: 'الملف الشخصي',
        route: '/(tabs)/profile',
      },
      {
        key: 'favorites',
        icon: 'heart',
        label: 'المفضلة',
        route: '/favorites',
      },
      {
        key: 'posts',
        icon: 'newspaper',
        label: 'مجلس سرح',
        route: '/(tabs)/posts',
      },
      {
        key: 'butchers',
        icon: 'storefront-outline',
        label: 'سوق الملاحم',
        route: '/butchers',
      },
      {
        key: 'promote',
        icon: 'megaphone-outline',
        label: 'تعزيز سرح',
        route: '/promote',
      },
      {
        key: 'sarh-services',
        icon: 'briefcase-outline',
        label: 'خدمات سرح',
        route: '/sarh-services',
      },
      {
        key: 'support',
        icon: 'lifebuoy',
        label: 'الدعم والمساعدة',
        route: '/support',
      },
      {
        key: 'settings',
        icon: 'settings-outline',
        label: 'الإعدادات والخصوصية',
        route: '/profile/settings',
      },
    ],
    [],
  );

  return (
    <View style={[styles.backdrop, getRtlRow()]}>
      <SafeAreaView style={styles.panel} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
            <AppIcon name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, getRtlDirection()]}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.menuCard,
              {
                backgroundColor: colors.bgElevated,
                borderColor: colors.borderSoft,
              },
            ]}
          >
            {menuItems.map((item, index) => (
              <SidebarMenuRow
                key={item.key}
                item={item}
                colors={colors}
                isLast={index === menuItems.length - 1}
                onPress={() => (item.route ? handleNav(item.route) : item.onPress?.())}
              />
            ))}
          </View>

          <SidebarThemeToggle
            preference={preference}
            colors={colors}
            onToggle={toggleTheme}
          />

          <SidebarLogoutButton colors={colors} onPress={handleSignOut} />

          <SidebarFooterArt />
        </ScrollView>
      </SafeAreaView>

      <Pressable style={styles.backdropTap} onPress={() => router.back()} />
    </View>
  );
}

function createSidebarStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const panelBg = panelSurfaceBg(scheme, colors);

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: scrimColor(scheme, 0.45),
    },
    backdropTap: {
      flex: 1,
    },
    panel: {
      width: '88%',
      maxWidth: 400,
      alignSelf: 'stretch',
      backgroundColor: panelBg,
      ...borderInlineEnd(StyleSheet.hairlineWidth, colors.borderMid),
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: scheme === 'dark' ? -4 : -2, height: 0 },
      shadowOpacity: scheme === 'dark' ? 0.35 : 0.1,
      shadowRadius: 16,
      elevation: 10,
    },
    header: {
      ...alignInlineEnd(),
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuCard: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    scroll: {
      flex: 1,
      ...getRtlDirection(),
    },
    scrollContent: {
      paddingBottom: spacing.lg,
    },
  });
}
