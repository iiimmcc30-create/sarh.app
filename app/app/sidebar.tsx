// Powered by OnSpace.AI
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  scrimColor,
  spacing,
  typography,
  panelSurfaceBg,
  type ThemeColors,
} from '@/constants/theme';
import { pp } from '@/constants/pixelPerfect';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { rtlDirection, rtlRow } from '@/lib/rtl';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { useButcherOwnerAccess } from '@/hooks/useButcherOwnerAccess';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';
import { useMessageThreads } from '@/hooks/useMessageThreads';
import { SidebarFooterArt } from '@/components/feature/SidebarFooterArt';
import { confirmSignOut } from '@/lib/confirmSignOut';
import {
  SidebarLogoutButton,
  SidebarMenuRow,
  SidebarSection,
  type SidebarMenuItem,
} from '@/components/feature/SidebarMenu';

type MenuItem = SidebarMenuItem;

export default function SidebarScreen() {
  const router = useRouter();
  const { me, refetchData } = useApp();
  const { signOut, accessToken } = useAuth();
  const { preference, setPreference, colors } = useTheme();
  const styles = useThemedStyles((theme) => createSidebarStyles(theme.colors, theme.scheme));
  const { unreadCount: notificationsUnread } = useUnreadNotificationCount();
  const { threads } = useMessageThreads(accessToken, 'DIRECT');
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
      void refetchData();
    }, [refresh, refetchData]),
  );

  const messagesUnread = useMemo(
    () => threads.reduce((sum, thread) => sum + (thread.unread ?? 0), 0),
    [threads],
  );

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

  const accountItems: MenuItem[] = [
    {
      key: 'messages',
      icon: 'chatbubble-outline',
      label: 'الرسائل',
      route: '/(tabs)/messages',
      badge: messagesUnread,
    },
    {
      key: 'notifications',
      icon: 'notifications-outline',
      label: 'الإشعارات',
      route: '/notifications',
      badge: notificationsUnread,
    },
    {
      key: 'subscription',
      icon: 'crown',
      label: 'الباقات والاشتراك',
      route: '/subscription',
    },
    {
      key: 'settings',
      icon: 'settings-outline',
      label: 'الإعدادات',
      route: '/profile/settings',
    },
  ];

  const marketItems: MenuItem[] = [
    {
      key: 'butchers',
      icon: 'storefront-outline',
      label: 'سوق الملاحم',
      route: '/butchers',
    },
    {
      key: 'map',
      icon: 'map-outline',
      label: 'خريطة الملاحم',
      route: '/butchers/map',
    },
  ];

  const ownerItems: MenuItem[] = useMemo(() => {
    if (!isButcherOwner) return [];

    const items: MenuItem[] = [
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
  }, [isButcherOwner, provisionedButcherId]);

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

  const serviceItems: MenuItem[] = [
    {
      key: 'orders',
      icon: 'bag-outline',
      label: 'طلباتي',
      route: isButcherOwner ? '/(butcher)/manage?tab=orders' : '/butchers',
    },
  ];

  return (
    <View style={[styles.backdrop, rtlRow]}>
      <SafeAreaView style={styles.panel} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
            <AppIcon name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            router.back();
            setTimeout(() => router.push('/(tabs)/profile'), 100);
          }}
          style={[styles.profileRow, rtlRow]}
        >
          <View style={styles.avatarWrap}>
            <Image source={uriSource(me.avatar)} style={styles.avatar} contentFit="cover" />
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.displayName} numberOfLines={1}>
              {me.arabicName || me.displayName || me.username}
            </Text>
            <Text style={styles.usernameText} numberOfLines={1}>
              @{me.username || 'user'}
            </Text>
            {me.verified ? (
              <View style={styles.verifiedPill}>
                <AppIcon name="shield-checkmark" size={12} color={pp.verifiedText} />
                <Text style={styles.verifiedText}>عضو موثق</Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, rtlDirection]}
          keyboardShouldPersistTaps="handled"
        >
          <SidebarSection title="الحساب" colors={colors}>
            {accountItems.map((item) => (
              <SidebarMenuRow
                key={item.key}
                item={item}
                colors={colors}
                onPress={() => (item.route ? handleNav(item.route) : item.onPress?.())}
              />
            ))}
          </SidebarSection>

          <SidebarSection title="سوق الملاحم" colors={colors}>
            {marketItems.map((item) => (
              <SidebarMenuRow
                key={item.key}
                item={item}
                colors={colors}
                onPress={() => (item.route ? handleNav(item.route) : item.onPress?.())}
              />
            ))}
          </SidebarSection>

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

          <SidebarSection title="الخدمات" colors={colors}>
            {serviceItems.map((item) => (
              <SidebarMenuRow
                key={item.key}
                item={item}
                colors={colors}
                onPress={() => (item.route ? handleNav(item.route) : item.onPress?.())}
              />
            ))}
          </SidebarSection>

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
          </SidebarSection>

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
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.borderMid,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: scheme === 'dark' ? -4 : -2, height: 0 },
      shadowOpacity: scheme === 'dark' ? 0.35 : 0.1,
      shadowRadius: 16,
      elevation: 10,
    },
    header: {
      alignItems: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileRow: {
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    avatarWrap: {
      position: 'relative',
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 2,
      borderColor: colors.electric,
      backgroundColor: colors.bgElevated,
    },
    onlineDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.emerald,
      borderWidth: 2,
      borderColor: panelBg,
    },
    profileText: {
      flex: 1,
      minWidth: 0,
      gap: 4,
      alignItems: 'flex-start',
    },
    displayName: {
      ...typography.h3,
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      writingDirection: 'rtl',
      textAlign: 'right',
    },
    usernameText: {
      ...typography.caption,
      fontSize: 14,
      color: colors.textMuted,
      writingDirection: 'rtl',
      textAlign: 'right',
    },
    verifiedPill: {
      ...rtlRow,
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: pp.verifiedBg,
    },
    verifiedText: {
      ...typography.micro,
      fontSize: 11,
      fontWeight: '700',
      color: pp.verifiedText,
      writingDirection: 'rtl',
    },
    scroll: {
      flex: 1,
      ...rtlDirection,
    },
    scrollContent: {
      paddingBottom: spacing.lg,
    },
  });
}
