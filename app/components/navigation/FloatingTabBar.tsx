import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ambientShadow, ds } from '@/constants/designSystem';
import { sarh } from '@/constants/sarhTokens';
import { motion, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow } from '@/lib/rtl';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { navigateToCreateListing } from '@/lib/navigateToCreateListing';
import { isNavigationLocked, safeNavigateTab } from '@/lib/safeNavigate';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ICON_SIZE = 22;
const ADD_BOX = 22;

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
  const { colors, scheme } = useTheme();
  const isLight = scheme === 'light';
  const tokens = isLight ? ds.light : ds.dark;
  const bottomPad = Math.max(insets.bottom, ds.tabBar.marginBottom);
  const activeTint = isLight ? colors.electricBright : sarh.color.action;
  const inactiveTint = isLight ? colors.textMuted : '#E8EEF2';

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
      <View
        style={[
          styles.bar,
          { paddingBottom: bottomPad },
          isLight
            ? {
                backgroundColor: tokens.glass,
                borderTopColor: tokens.glassBorder,
              }
            : {
                backgroundColor: '#0A161E',
                borderTopColor: 'rgba(255,255,255,0.06)',
              },
          ambientShadow(scheme, 'soft'),
        ]}
      >
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
                    <View style={[styles.addBox, { borderColor: inactiveTint }]}>
                      <AppIcon name="plus" size={14} color={activeTint} variant="sr" />
                    </View>
                  </View>
                  <Text
                    style={[
                      typography.tab,
                      { color: inactiveTint },
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
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
                <Text
                  style={[
                    focused ? typography.tabActive : typography.tab,
                    { color: tint },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
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
    paddingHorizontal: ds.tabBar.marginH,
  },
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  row: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 52,
    paddingVertical: 2,
    paddingHorizontal: 2,
    gap: 4,
  },
  /** Fixed icon box so every tab (including +) shares the same visual height. */
  iconSlot: {
    width: ICON_SIZE + 2,
    height: ICON_SIZE + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBox: {
    width: ADD_BOX,
    height: ADD_BOX,
    borderRadius: 5,
    borderWidth: 1.75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    ...typography.tab,
  },
  pressed: {
    transform: [{ scale: motion.pressScale }],
    opacity: 0.92,
  },
});

export default FloatingTabBar;
