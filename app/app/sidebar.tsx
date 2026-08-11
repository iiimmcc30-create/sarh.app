// Powered by OnSpace.AI
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { AppLogo } from '@/components/ui/AppLogo';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScrollView } from '@/components/ui/AppScrollView';
import {
  BRAND_LOGIN_SUBTITLE_AR,
  BRAND_NAME_AR,
} from '@/constants/brandCopy';
import {
  scrimColor,
  spacing,
  typography,
  panelSurfaceBg,
  type ThemeColors,
} from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { borderInlineEnd, getRtlRow } from '@/lib/rtl';
import { useAuth } from '@/contexts/AuthContext';
import { useButcherOwnerAccess } from '@/hooks/useButcherOwnerAccess';
import { SidebarFooterArt } from '@/components/feature/SidebarFooterArt';
import { confirmSignOut } from '@/lib/confirmSignOut';
import { closeThenPush, safeReplace } from '@/lib/safeNavigate';
import {
  SidebarLogoutButton,
  SidebarMenuRow,
  SidebarSection,
  type SidebarNavItem,
} from '@/components/feature/SidebarMenu';

type MenuItem = SidebarNavItem;

export default function SidebarScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles((theme) => createSidebarStyles(theme.colors, theme.scheme));
  const { isButcherOwner, refresh } = useButcherOwnerAccess();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleNav = (route: string) => {
    closeThenPush(route, undefined, router);
  };

  const handleSignOut = () => {
    confirmSignOut(async () => {
      router.back();
      await signOut();
      setTimeout(() => safeReplace('/auth/phone', { force: true }, router), 300);
    });
  };

  /** الملف الشخصي · المنشورات · الملاحم · إدارة الملحمة · المفضلة */
  const browseItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [
      {
        key: 'profile',
        icon: 'user',
        label: 'الملف الشخصي',
        route: '/(tabs)/profile',
      },
      {
        key: 'posts',
        icon: 'newspaper',
        label: 'المنشورات',
        route: '/(tabs)/posts',
      },
      {
        key: 'butchers',
        icon: 'storefront-outline',
        label: 'الملاحم',
        route: '/butchers',
      },
    ];

    if (isButcherOwner) {
      items.push({
        key: 'manage-butcher',
        icon: 'grid-outline',
        label: 'إدارة الملحمة',
        route: '/(butcher)/manage',
      });
    }

    items.push({
      key: 'favorites',
      icon: 'heart',
      label: 'المفضلة',
      route: '/favorites',
    });

    return items;
  }, [isButcherOwner]);

  /** تعزيز سرح · خدمات سرح */
  const sarhItems: MenuItem[] = useMemo(
    () => [
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
    ],
    [],
  );

  /** الإعدادات والخصوصية */
  const settingsItems: MenuItem[] = useMemo(
    () => [
      {
        key: 'settings',
        icon: 'settings-outline',
        label: 'الإعدادات والخصوصية',
        route: '/profile/settings',
      },
    ],
    [],
  );

  const renderSectionItems = (items: MenuItem[]) =>
    items.map((item, index) => (
      <SidebarMenuRow
        key={item.key}
        item={item}
        colors={colors}
        isLast={index === items.length - 1}
        onPress={() => (item.route ? handleNav(item.route) : item.onPress?.())}
      />
    ));

  return (
    <View style={[styles.backdrop, getRtlRow()]}>
      <SafeAreaView style={styles.panel} edges={['top', 'bottom']}>
        {/* Compact brand stack — close overlays the top corner to cut empty space. */}
        <View style={styles.brandBanner}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
            <AppIcon name="close" size={20} color={colors.textPrimary} />
          </Pressable>
          <AppLogo size={64} />
          <Text style={styles.brandName}>{BRAND_NAME_AR}</Text>
          <Text style={styles.brandTagline}>{BRAND_LOGIN_SUBTITLE_AR}</Text>
        </View>

        <AppScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <SidebarSection colors={colors}>{renderSectionItems(browseItems)}</SidebarSection>
          <SidebarSection colors={colors}>{renderSectionItems(sarhItems)}</SidebarSection>
          <SidebarSection colors={colors}>{renderSectionItems(settingsItems)}</SidebarSection>

          <SidebarLogoutButton colors={colors} onPress={handleSignOut} />

          <SidebarFooterArt />
        </AppScrollView>
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
    brandBanner: {
      alignItems: 'center',
      gap: 4,
      marginHorizontal: spacing.lg,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
      alignSelf: 'stretch',
      position: 'relative',
    },
    closeBtn: {
      position: 'absolute',
      top: 0,
      end: spacing.xs,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    brandName: {
      ...typography.h2,
      fontSize: 26,
      lineHeight: 30,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    brandTagline: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: 12,
      lineHeight: 18,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.lg,
      paddingTop: 0,
    },
  });
}
