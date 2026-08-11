import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { ambientShadow, ds } from '@/constants/designSystem';
import { appFont } from '@/constants/fonts';
import { sarh } from '@/constants/sarhTokens';
import { motion, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow, isAppRtl } from '@/lib/rtl';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { navigateToCreateListing } from '@/lib/navigateToCreateListing';
import { isNavigationLocked, safeNavigateTab } from '@/lib/safeNavigate';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const VISIBLE_TABS: { route: string; icon: string; label: string }[] = [
  { route: 'index', icon: 'home', label: 'الرئيسية' },
  { route: 'market', icon: 'tags', label: 'السوق' },
  { route: 'messages', icon: 'chatbubble-outline', label: 'الرسائل' },
  { route: 'profile', icon: 'user', label: 'حسابي' },
];

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, gradients, scheme } = useTheme();
  const isLight = scheme === 'light';
  const tokens = isLight ? ds.light : ds.dark;
  const bottom = Math.max(insets.bottom, ds.tabBar.marginBottom);
  const activeTint = isLight ? colors.electricBright : sarh.color.action;
  const inactiveTint = isLight ? colors.textMuted : sarh.color.textMuted;

  const activeRoute = state.routes[state.index]?.name;

  const onTabPress = (routeName: string, isFocused: boolean) => {
    if (isFocused || isNavigationLocked()) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes.find((r) => r.name === routeName)?.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      safeNavigateTab((name) => navigation.navigate(name), routeName, isFocused);
    }
  };

  const leftTabs = VISIBLE_TABS.slice(0, 2);
  const rightTabs = VISIBLE_TABS.slice(2);

  const renderTab = (tab: (typeof VISIBLE_TABS)[number]) => {
    const focused = activeRoute === tab.route;
    const tint = focused ? activeTint : inactiveTint;
    return (
      <Pressable
        key={tab.route}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        onPress={() => onTabPress(tab.route, focused)}
        style={({ pressed }) => [styles.tabSlot, pressed && styles.pressed]}
      >
        <AppIcon
          name={tab.icon}
          size={ds.icon.tab}
          color={tint}
          variant={focused ? 'sr' : 'rr'}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: tint,
              fontFamily: focused ? appFont.semibold : appFont.medium,
              fontWeight: focused ? '600' : '500',
            },
          ]}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { paddingBottom: bottom }]} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          isLight
            ? {
                backgroundColor: tokens.glass,
                borderColor: tokens.glassBorder,
              }
            : styles.barDark,
          ambientShadow(scheme, 'card'),
        ]}
      >
        <View style={[styles.row, getRtlRow()]}>
          {leftTabs.map(renderTab)}

          <View style={styles.fabSlot}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إضافة إعلان"
              onPress={() => void navigateToCreateListing()}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              {isLight ? (
                <LinearGradient
                  colors={gradients.electric}
                  style={[styles.fab, ambientShadow(scheme, 'fab'), { borderColor: tokens.page }]}
                >
                  <AppIcon name="plus" variant="sr" size={ds.icon.fab} color={sarh.color.fab} />
                </LinearGradient>
              ) : (
                <View style={[styles.fab, ambientShadow(scheme, 'fab')]}>
                  <AppIcon
                    name="plus"
                    variant="sr"
                    size={ds.icon.fab}
                    color={sarh.color.fabIcon}
                  />
                </View>
              )}
            </Pressable>
          </View>

          {rightTabs.map(renderTab)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: ds.tabBar.marginH,
  },
  bar: {
    borderRadius: sarh.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  barDark: {
    backgroundColor: sarh.color.surface,
    borderColor: sarh.color.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: sarh.radius.md,
    paddingVertical: spacing.xs,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: spacing.xs / 2,
    writingDirection: isAppRtl() ? 'rtl' : 'ltr',
  },
  fabSlot: {
    width: ds.tabBar.fabSize + 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -ds.tabBar.fabLift - 2,
  },
  fab: {
    width: ds.tabBar.fabSize + 4,
    height: ds.tabBar.fabSize + 4,
    borderRadius: sarh.radius.fab,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: sarh.color.fab,
    borderWidth: 3,
    borderColor: sarh.color.bg,
  },
  pressed: {
    transform: [{ scale: motion.pressScale }],
    opacity: 0.92,
  },
});

export default FloatingTabBar;
