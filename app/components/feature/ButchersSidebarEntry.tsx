// Powered by OnSpace.AI
// SAFAT — ButchersSidebarEntry
// Public butcher discovery + owner tools when application is approved.
import { SidebarMenuItem } from '@/components/ui/SidebarMenuItem';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useButcherOwnerAccess } from '@/hooks/useButcherOwnerAccess';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { closeThenPush } from '@/lib/safeNavigate';

type SidebarRouteItem = {
  icon: string;
  arabic: string;
  route: string;
  ownerOnly?: boolean;
};

const PUBLIC_ITEMS: SidebarRouteItem[] = [
  { icon: 'storefront-outline', arabic: 'سوق الملاحم', route: '/butchers' },
  { icon: 'map-outline', arabic: 'خريطة الملاحم', route: '/butchers/map' },
];

const APPLICATION_ITEMS: SidebarRouteItem[] = [
  { icon: 'document-text-outline', arabic: 'طلب تسجيل ملحمة', route: '/butchers/apply' },
  { icon: 'folder-open-outline', arabic: 'طلبي', route: '/butchers/my-application' },
];

const OWNER_ITEMS: SidebarRouteItem[] = [
  { icon: 'bar-chart-outline', arabic: 'لوحة التحليلات', route: '/(butcher)', ownerOnly: true },
  { icon: 'settings-outline', arabic: 'إدارة الملحمة', route: '/(butcher)/manage', ownerOnly: true },
  { icon: 'create-outline', arabic: 'تعديل بيانات الملحمة', route: '/butchers/edit', ownerOnly: true },
  { icon: 'chatbubbles-outline', arabic: 'رسائل العملاء', route: '/(butcher)/messages', ownerOnly: true },
];

export function ButchersSidebarEntry() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const {
    isButcherOwner,
    hasAnyApplication,
    hasPendingApplication,
    provisionedButcherId,
  } = useButcherOwnerAccess();

  const visibleItems = useMemo(() => {
    const items: SidebarRouteItem[] = [...PUBLIC_ITEMS];

    if (isButcherOwner) {
      items.push(...OWNER_ITEMS);
      if (provisionedButcherId) {
        items.push({
          icon: 'storefront-outline',
          arabic: 'صفحة ملحمتي',
          route: `/butchers/${provisionedButcherId}`,
          ownerOnly: true,
        });
      }
      if (hasAnyApplication) {
        items.push(APPLICATION_ITEMS[1]);
      }
      return items;
    }

    if (!hasPendingApplication) {
      items.push(APPLICATION_ITEMS[0]);
    }
    if (hasAnyApplication) {
      items.push(APPLICATION_ITEMS[1]);
    }

    return items;
  }, [
    isButcherOwner,
    hasAnyApplication,
    hasPendingApplication,
    provisionedButcherId,
  ]);

  const navigate = (route: string) => {
    closeThenPush(route, undefined, router);
  };

  return (
    <View style={styles.card}>
      {visibleItems.map((item, idx) => (
        <SidebarMenuItem
          key={`${item.route}-${item.arabic}`}
          icon={item.icon}
          title={item.arabic}
          colors={colors}
          showDivider={idx < visibleItems.length - 1}
          onPress={() => navigate(item.route)}
        />
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginHorizontal: spacing.lg,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      backgroundColor: colors.bgElevated,
      overflow: 'hidden',
    },
  });
}
