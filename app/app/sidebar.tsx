// Powered by OnSpace.AI
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScrollView } from '@/components/ui/AppScrollView';
import {
  scrimColor,
  spacing,
  panelSurfaceBg,
  type ThemeColors,
} from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/hooks/useApp';
import { borderInlineEnd, getRtlRow } from '@/lib/rtl';
import { useAuth } from '@/contexts/AuthContext';
import { useButcherOwnerAccess } from '@/hooks/useButcherOwnerAccess';
import { SidebarFooterArt } from '@/components/feature/SidebarFooterArt';
import { SidebarCloseHeader } from '@/components/feature/SidebarCloseHeader';
import { SidebarProfileRow } from '@/components/feature/SidebarProfileRow';
import { confirmSignOut } from '@/lib/confirmSignOut';
import { closeThenPush, safeReplace } from '@/lib/safeNavigate';
import {
  SidebarLogoutButton,
  SidebarMenuRow,
  SidebarSection,
  type SidebarNavItem,
} from '@/components/feature/SidebarMenu';
import { usePaidServices } from '@/hooks/usePaidServices';

type MenuItem = SidebarNavItem;

export default function SidebarScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { me } = useApp();
  const { colors } = useTheme();
  const styles = useThemedStyles((theme) => createSidebarStyles(theme.colors, theme.scheme));
  const { isButcherOwner, refresh } = useButcherOwnerAccess();
  const { hasAnyBoostService } = usePaidServices();

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

  /** تعزيز سرح (خدمات الوزارة أصبحت في تبويب المزيد) */
  const sarhItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [];
    if (hasAnyBoostService) {
      items.push({
        key: 'promote',
        icon: 'megaphone-outline',
        label: 'تعزيز سرح',
        route: '/promote',
      });
    }
    return items;
  }, [hasAnyBoostService]);

  /** الدعم والمساعدة · الإعدادات والخصوصية — بطاقة واحدة */
  const settingsItems: MenuItem[] = useMemo(
    () => [
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
        <SidebarCloseHeader onClose={() => router.back()} colors={colors} />

        <SidebarProfileRow
          avatarUri={me.avatar}
          displayName={me.arabicName || me.displayName || me.username}
          username={me.username || 'user'}
          colors={colors}
          onPress={() => handleNav('/(tabs)/profile')}
        />

        <AppScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <SidebarSection colors={colors}>{renderSectionItems(browseItems)}</SidebarSection>
          {sarhItems.length > 0 ? (
            <SidebarSection colors={colors}>{renderSectionItems(sarhItems)}</SidebarSection>
          ) : null}
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
  const isDark = scheme === 'dark';
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
      shadowOffset: { width: isDark ? -4 : -2, height: 0 },
      shadowOpacity: isDark ? 0.35 : 0.1,
      shadowRadius: isDark ? 16 : 20,
      elevation: 10,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.lg,
      paddingTop: spacing.md,
    },
  });
}
