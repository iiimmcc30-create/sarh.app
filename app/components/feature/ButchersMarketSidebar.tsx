import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { SidebarMenuItem } from '@/components/ui/SidebarMenuItem';
import { useRouter, useSegments } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sarh } from '@/constants/sarhTokens';
import {
  panelSurfaceBg,
  spacing,
  typography,
  type ThemeColors,
} from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useApp } from '@/hooks/useApp';
import { borderInlineEnd } from '@/lib/rtl';
import { closeThenPush } from '@/lib/safeNavigate';

export type ButchersMarketMenuItem = {
  key: string;
  icon: string;
  label: string;
  route: string;
  matchRoutes?: string[];
};

export const BUTCHERS_MARKET_MENU: ButchersMarketMenuItem[] = [
  { key: 'home', icon: 'home-outline', label: 'الرئيسية', route: '/(tabs)' },
  {
    key: 'butchers',
    icon: 'storefront-outline',
    label: 'الملاحم',
    route: '/butchers',
    matchRoutes: ['/butchers', '/butchers/map'],
  },
  {
    key: 'orders',
    icon: 'bag-outline',
    label: 'طلباتي',
    route: '/butchers/my-orders',
    matchRoutes: ['/butchers/my-orders', '/butchers/order'],
  },
  {
    key: 'favorites',
    icon: 'heart-outline',
    label: 'تفضيلاتي',
    route: '/butchers/favorites',
  },
  {
    key: 'invoices',
    icon: 'receipt-outline',
    label: 'الفواتير',
    route: '/butchers/invoices',
    matchRoutes: ['/butchers/invoices', '/butchers/invoice'],
  },
  {
    key: 'register',
    icon: 'document-text-outline',
    label: 'سجل ملحمتك',
    route: '/butchers/apply',
  },
  {
    key: 'support',
    icon: 'chatbubble-ellipses-outline',
    label: 'الدعم والمساعدة',
    route: '/settings/support',
  },
  {
    key: 'privacy',
    icon: 'shield-outline',
    label: 'سياسة الخصوصية',
    route: '/info/privacy',
  },
];

type Props = {
  onClose: () => void;
};

function isItemActive(item: ButchersMarketMenuItem, path: string): boolean {
  const matches = item.matchRoutes ?? [item.route];
  return matches.some((route) => path === route || path.startsWith(`${route}/`));
}

export function ButchersMarketSidebarPanel({ onClose }: Props) {
  const router = useRouter();
  const segments = useSegments();
  const { me } = useApp();
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors, theme.scheme),
    colors: theme.colors,
  }));
  const currentPath = `/${segments.join('/')}`;

  const handleNav = (route: string) => {
    // onClose = router.back via shell; closeThenPush handles back + guarded push
    closeThenPush(route, undefined, router);
  };

  return (
    <SafeAreaView
      style={[styles.panel, borderInlineEnd(StyleSheet.hairlineWidth, colors.borderMid)]}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <AppIcon name="close" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => handleNav('/(tabs)/profile')}
        style={styles.profileRow}
      >
        <Image source={uriSource(me.avatar)} style={styles.avatar} contentFit="cover" />
        <View style={styles.profileText}>
          <Text style={styles.displayName} numberOfLines={1}>
            {me.arabicName || me.displayName || me.username}
          </Text>
          <Text style={styles.usernameText} numberOfLines={1}>
            @{me.username || 'user'}
          </Text>
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>قسم الملاحم</Text>
          </View>
        </View>
      </Pressable>

      <AppScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.menuCard}>
          {BUTCHERS_MARKET_MENU.map((item, index) => (
            <SidebarMenuItem
              key={item.key}
              icon={item.icon}
              title={item.label}
              active={isItemActive(item, currentPath)}
              showDivider={index < BUTCHERS_MARKET_MENU.length - 1}
              colors={colors}
              onPress={() => handleNav(item.route)}
            />
          ))}
        </View>
      </AppScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>سرح · سوق الملاحم</Text>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const isDark = scheme === 'dark';
  const panelBg = panelSurfaceBg(scheme, colors);

  return StyleSheet.create({
    panel: {
      width: '88%',
      maxWidth: 400,
      alignSelf: 'stretch',
      backgroundColor: panelBg,
      shadowColor: '#000',
      shadowOffset: { width: isDark ? -4 : -2, height: 0 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: isDark ? 16 : 20,
      elevation: 12,
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
    brandPill: {
      marginTop: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: isDark ? sarh.color.actionMuted : '#E8F9E3',
    },
    brandPillText: {
      ...typography.micro,
      fontWeight: '600',
      color: isDark ? colors.textPrimary : '#3FA82E',
      writingDirection: 'rtl', textAlign: 'right' as const,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingVertical: spacing.md,
      paddingBottom: spacing.lg,
    },
    menuCard: {
      marginHorizontal: spacing.lg,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      backgroundColor: colors.bgElevated,
      overflow: 'hidden',
    },
    footer: {
      paddingVertical: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderMid,
      alignItems: 'center',
    },
    footerText: {
      ...typography.micro,
      color: colors.textMuted,
      writingDirection: 'rtl', textAlign: 'right' as const,
    },
  });
}

export default ButchersMarketSidebarPanel;
