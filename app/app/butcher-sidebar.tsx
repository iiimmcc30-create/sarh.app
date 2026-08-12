// Powered by OnSpace.AI
// SAFAT — Butcher sidebar (owner management + butcher services)
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  scrimColor,
  spacing,
  panelSurfaceBg,
  type ThemeColors,
} from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { borderInlineEnd, getRtlRow } from '@/lib/rtl';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { useButcherOwnerAccess } from '@/hooks/useButcherOwnerAccess';
import { useMessageThreads } from '@/hooks/useMessageThreads';
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

  return (
    <View style={[styles.backdrop, getRtlRow()]}>
      <SafeAreaView style={styles.panel} edges={['top', 'bottom']}>
        <SidebarCloseHeader onClose={() => router.back()} colors={colors} />

        <SidebarProfileRow
          avatarUri={me.avatar}
          displayName={me.arabicName || me.displayName || me.username}
          username={me.username || 'user'}
          badgeLabel="إدارة الملحمة"
          colors={colors}
          onPress={() => closeThenPush('/(butcher)/profile', { closeDelayMs: 100 }, router)}
        />

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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.lg,
      paddingTop: spacing.md,
    },
  });
}
