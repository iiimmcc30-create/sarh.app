// Powered by OnSpace.AI
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { APP_LOGO } from '@/constants/branding';
import { BRAND_NAME_AR } from '@/constants/brandCopy';
import {
  scrimColor,
  spacing,
  typography,
  panelSurfaceBg,
  type ThemeColors,
} from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { alignInlineEnd, borderInlineEnd, getRtlRow, getRtlText } from '@/lib/rtl';
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

const BRAND_TAGLINE = 'منصة المواشي السعودية';

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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
            <AppIcon name="close" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={[styles.brandBanner, getRtlRow()]}>
          <View style={styles.brandText}>
            <Text style={styles.brandName}>{BRAND_NAME_AR}</Text>
            <Text style={styles.brandTagline}>{BRAND_TAGLINE}</Text>
          </View>
          {/* Official mark — white waves + green diamond stay as-is (no tint). */}
          <View style={styles.brandMarkWrap}>
            <Image
              source={APP_LOGO}
              style={styles.brandMark}
              contentFit="cover"
              accessibilityLabel="شعار سرح"
            />
          </View>
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
    header: {
      ...alignInlineEnd(),
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
    brandBanner: {
      alignItems: 'center',
      gap: spacing.md,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: 16,
      backgroundColor: panelBg,
    },
    brandMarkWrap: {
      width: 56,
      height: 56,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: panelBg,
    },
    brandMark: {
      width: 56,
      height: 56,
    },
    brandText: {
      flex: 1,
      minWidth: 0,
      gap: 4,
      alignItems: 'flex-end',
    },
    brandName: {
      ...typography.h2,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '600',
      color: colors.textPrimary,
      writingDirection: 'rtl',
      ...getRtlText(),
    },
    brandTagline: {
      ...typography.caption,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '500',
      color: colors.textMuted,
      writingDirection: 'rtl',
      ...getRtlText(),
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.lg,
    },
  });
}
