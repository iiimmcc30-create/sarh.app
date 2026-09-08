import { AppIcon } from '@/components/ui/FlaticonIcon';
import { AppText } from '@/design-system/components';
import { colors, elevation, motion, space } from '@/design-system';
import { ds } from '@/constants/designSystem';
import { getRtlRow } from '@/lib/rtl';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { navigateToCreateListing } from '@/lib/navigateToCreateListing';
import { isNavigationLocked, safeNavigateTab } from '@/lib/safeNavigate';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ICON_SIZE = 22;

type TabDef =
  | { kind: 'route'; route: string; icon: string; label: string }
  | { kind: 'create'; label: string };

/**
 * Visual RTL order (right→left):
 * الرئيسية · السوق · إضافة عرض · المحادثات · مجتمع سرح
 */
const TABS: TabDef[] = [
  { kind: 'route', route: 'index', icon: 'home-outline', label: 'الرئيسية' },
  { kind: 'route', route: 'market', icon: 'cart-outline', label: 'السوق' },
  { kind: 'create', label: 'إضافة عرض' },
  { kind: 'route', route: 'messages', icon: 'chatbubble-ellipses-outline', label: 'المحادثات' },
  { kind: 'route', route: 'posts', icon: 'people-outline', label: 'مجتمع سرح' },
];

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, ds.tabBar.marginBottom);
  const activeTint = colors.primary;
  const inactiveTint = colors.textMuted;

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

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={[styles.bar, { paddingBottom: bottomPad }]}>
        <View style={[styles.row, getRtlRow()]}>
          {TABS.map((tab) => {
            if (tab.kind === 'create') {
              return (
                <Pressable
                  key="create"
                  accessibilityRole="button"
                  accessibilityLabel={tab.label}
                  onPress={() => void navigateToCreateListing()}
                  style={({ pressed }) => [styles.tabSlot, pressed && styles.pressed]}
                >
                  <View style={styles.iconSlot}>
                    <AppIcon name="plus" size={ICON_SIZE} color={activeTint} variant="sr" />
                  </View>
                  <AppText variant="micro" color="textMuted" numberOfLines={1}>
                    {tab.label}
                  </AppText>
                </Pressable>
              );
            }

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
                <View style={styles.iconSlot}>
                  <AppIcon
                    name={tab.icon}
                    size={ICON_SIZE}
                    color={tint}
                    variant={focused ? 'sr' : 'rr'}
                  />
                </View>
                <AppText
                  variant="micro"
                  color={focused ? 'primary' : 'textMuted'}
                  style={focused ? styles.labelActive : undefined}
                  numberOfLines={1}
                >
                  {tab.label}
                </AppText>
              </Pressable>
            );
          })}
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
    paddingHorizontal: 0,
  },
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: space[8],
    paddingHorizontal: space[4],
    ...elevation.subtle,
  },
  row: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: space[48],
    paddingVertical: space[4],
    paddingHorizontal: space[4],
    gap: space[4],
  },
  iconSlot: {
    width: space[24],
    height: space[24],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  labelActive: {
    fontWeight: '600',
  },
  pressed: {
    transform: [{ scale: motion.pressScale }],
    opacity: motion.opacity.pressed,
  },
});

export default FloatingTabBar;
