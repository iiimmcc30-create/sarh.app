// Powered by OnSpace.AI
// SAFAT — Butcher sidebar (owner management + butcher services)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  scrimColor,
  spacing,
  typography,
  panelSurfaceBg,
  type ThemeColors,
} from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { alignInlineEnd, borderInlineEnd, getRtlRow } from '@/lib/rtl';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { useButcherOwnerAccess } from '@/hooks/useButcherOwnerAccess';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';
import { useMessageThreads } from '@/hooks/useMessageThreads';
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

export default function ButcherSidebarScreen() {
  const router = useRouter();
  const { me } = useApp();
  const { signOut, accessToken } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles((theme) => createSidebarStyles(theme.colors, theme.scheme));
  const { threads } = useMessageThreads(accessToken, 'BUTCHER');
  const {
    isButcherOwner,
    hasAnyApplication,
    hasPendingApplication,
    provisionedButcherId,
    refresh,
  } = useButcherOwnerAccess();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const messagesUnread = useMemo(
    () => threads.reduce((sum, thread) => sum + (thread.unread ?? 0), 0),
    [threads],
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

  const toggleTheme = () => {
    setPreference(preference === 'dark' ? 'light' : 'dark');
  };

  const ownerItems: MenuItem[] = useMemo(() => {
    if (!isButcherOwner) return [];

    const items: MenuItem[] = [
      {
        key: 'orders',
        icon: 'bag-outline',
        label: 'الطلبات',
        route: '/(butcher)/manage?tab=orders',
      },
      {
        key: 'dashboard',
        icon: 'bar-chart-outline',
        label: 'لوحة التحليلات',
        route: '/(butcher)',
      },
      {
        key: 'manage',
        icon: 'settings-outline',
        label: 'إدارة الملحمة',
        route: '/(butcher)/manage',
      },
      {
        key: 'products',
        icon: 'cube-outline',
        label: 'المنتجات',
        route: '/(butcher)/manage?tab=products',
      },
      {
        key: 'offers',
        icon: 'pricetag-outline',
        label: 'العروض',
        route: '/(butcher)/manage?tab=offers',
      },
      {
        key: 'edit',
        icon: 'create-outline',
        label: 'تعديل بيانات الملحمة',
        route: '/butchers/edit',
      },
      {
        key: 'butcher-messages',
        icon: 'chatbubbles-outline',
        label: 'رسائل العملاء',
        route: '/(butcher)/messages',
        badge: messagesUnread,
      },
    ];

    if (provisionedButcherId) {
      items.push({
        key: 'my-page',
        icon: 'storefront-outline',
        label: 'صفحة ملحمتي',
        route: `/butchers/${provisionedButcherId}`,
      });
    }

    return items;
  }, [isButcherOwner, provisionedButcherId, messagesUnread]);

  const applicationItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [];

    if (isButcherOwner) {
      if (hasAnyApplication) {
        items.push({
          key: 'my-application',
          icon: 'folder-open-outline',
          label: 'طلبي',
          route: '/butchers/my-application',
        });
      }
      return items;
    }

    if (!hasPendingApplication) {
      items.push({
        key: 'apply',
        icon: 'document-text-outline',
        label: 'طلب تسجيل ملحمة',
        route: '/butchers/apply',
      });
    }

    if (hasAnyApplication) {
      items.push({
        key: 'my-application',
        icon: 'folder-open-outline',
        label: 'طلبي',
        route: '/butchers/my-application',
      });
    }

    return items;
  }, [isButcherOwner, hasAnyApplication, hasPendingApplication]);

  const generalItems: MenuItem[] = [
    {
      key: 'butchers',
      icon: 'storefront-outline',
      label: 'سوق الملاحم',
      route: '/butchers',
    },
    {
      key: 'notifications',
      icon: 'notifications-outline',
      label: 'الإشعارات',
      route: '/notifications',
      badge: notificationsUnread,
    },
    {
      key: 'promotion',
      icon: 'megaphone-outline',
      label: 'الترويج',
      route: '/promote',
    },
  ];

  return (
    <View style={[styles.backdrop, getRtlRow()]}>
      <SafeAreaView style={styles.panel} edges={['top', 'bottom']}>
        <View style={[styles.header, getRtlRow()]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
            <AppIcon name="close" size={22} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            onPress={() => closeThenPush('/(butcher)/profile', { closeDelayMs: 100 }, router)}
            style={styles.profileCenter}
          >
            <Image source={uriSource(me.avatar)} style={styles.avatar} contentFit="cover" />
            <Text style={styles.usernameText} numberOfLines={1}>
              @{me.username || 'user'}
            </Text>
          </Pressable>

          <View style={styles.headerSpacer} />
        </View>

        <AppScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {ownerItems.length > 0 ? (
            <SidebarSection title="إدارة ملحمتي" colors={colors}>
              {ownerItems.map((item) => (
                <SidebarMenuRow
                  key={item.key}
                  item={item}
                  colors={colors}
                  onPress={() => (item.route ? handleNav(item.route) : item.onPress?.())}
                />
              ))}
            </SidebarSection>
          ) : null}

          <SidebarSection title="عام" colors={colors}>
            {generalItems.map((item) => (
              <SidebarMenuRow
                key={item.key}
                item={item}
                colors={colors}
                onPress={() => (item.route ? handleNav(item.route) : item.onPress?.())}
              />
            ))}
          </SidebarSection>

          {applicationItems.length > 0 ? (
            <SidebarSection title="التسجيل والطلبات" colors={colors}>
              {applicationItems.map((item) => (
                <SidebarMenuRow
                  key={item.key}
                  item={item}
                  colors={colors}
                  onPress={() => (item.route ? handleNav(item.route) : item.onPress?.())}
                />
              ))}
            </SidebarSection>
          ) : null}

          <SidebarSection title="التفضيلات" colors={colors}>
            <SidebarMenuRow
              item={{
                key: 'theme',
                icon: preference === 'dark' ? 'weather-night' : 'sunny-outline',
                label: 'الوضع النهاري / الداكن',
              }}
              colors={colors}
              onPress={toggleTheme}
            />
            <SidebarMenuRow
              item={{
                key: 'main-app',
                icon: 'home-outline',
                label: 'العودة للتطبيق الرئيسي',
                route: '/(tabs)',
              }}
              colors={colors}
              isLast
              onPress={() => handleNav('/(tabs)')}
            />
          </SidebarSection>

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
      backgroundColor: scrimColor(scheme, 0.55),
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
      shadowOpacity: scheme === 'dark' ? 0.45 : 0.1,
      shadowRadius: 20,
      elevation: 12,
    },
    header: {
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.bgGlass,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: spacing.sm,
      minWidth: 0,
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.electric,
      backgroundColor: colors.bgElevated,
    },
    usernameText: {
      ...typography.bodyStrong,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
      writingDirection: 'rtl',
      maxWidth: '100%',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.lg,
    },
  });
}
