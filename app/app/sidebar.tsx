// Powered by OnSpace.AI
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScrollView } from '@/components/ui/AppScrollView';
import {
  scrimColor,
  spacing,
  typography,
  panelSurfaceBg,
  type ThemeColors,
} from '@/constants/theme';
import { sarh } from '@/constants/sarhTokens';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/hooks/useApp';
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
  const { me } = useApp();
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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
            <AppIcon name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => handleNav('/(tabs)/profile')}
          style={styles.profileRow}
        >
          <Image source={uriSource(me.avatar)} style={styles.avatar} contentFit="cover" />
          <View style={styles.profileText}>
            <Text style={styles.displayName} numberOfLines={2}>
              {me.arabicName || me.displayName || me.username}
            </Text>
            <Text style={styles.usernameText} numberOfLines={1}>
              @{me.username || 'user'}
            </Text>
          </View>
        </Pressable>

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
    header: {
      alignItems: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDark ? colors.bgElevated : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: isDark ? sarh.color.border : 'transparent',
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderMid,
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: sarh.color.action,
      backgroundColor: colors.bgElevated,
    },
    profileText: {
      flex: 1,
      minWidth: 0,
      gap: 3,
      alignItems: 'flex-start',
    },
    displayName: {
      ...typography.h3,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    usernameText: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
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
