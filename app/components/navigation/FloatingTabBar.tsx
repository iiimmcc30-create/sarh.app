import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { ambientShadow, ds } from '@/constants/designSystem';
import { luxuryDark } from '@/constants/homeLuxury';
import { motion } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { isAppRtl } from '@/lib/rtl';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { navigateToCreateListing } from '@/lib/navigateToCreateListing';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const VISIBLE_TABS: { route: string; icon: string; label: string }[] = [
  { route: 'index', icon: 'home', label: 'الرئيسية' },
  { route: 'market', icon: 'tags', label: 'السوق' },
  { route: 'posts', icon: 'newspaper', label: 'المنشورات' },
  { route: 'profile', icon: 'user', label: 'حسابي' },
];

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, gradients, scheme } = useTheme();
  const isLight = scheme === 'light';
  const tokens = isLight ? ds.light : ds.dark;
  const bottom = Math.max(insets.bottom, ds.tabBar.marginBottom);
  const activeTint = isLight ? colors.electricBright : luxuryDark.accent;
  const inactiveTint = isLight ? colors.textMuted : luxuryDark.textMuted;

  const activeRoute = state.routes[state.index]?.name;

  const onTabPress = (routeName: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes.find((r) => r.name === routeName)?.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const leftTabs = VISIBLE_TABS.slice(0, 2);
  const rightTabs = VISIBLE_TABS.slice(2);

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
            : styles.barLuxury,
          ambientShadow(scheme, 'card'),
        ]}
      >
        <View style={styles.row}>
          {leftTabs.map((tab) => {
            const focused = activeRoute === tab.route;
            const tint = focused ? activeTint : inactiveTint;
            return (
              <Pressable
                key={tab.route}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                onPress={() => onTabPress(tab.route, focused)}
                style={({ pressed }) => [
                  styles.tabSlot,
                  focused && !isLight && { backgroundColor: luxuryDark.accentSoft },
                  pressed && styles.pressed,
                ]}
              >
                <AppIcon
                  name={tab.icon}
                  size={ds.icon.tab}
                  color={tint}
                  variant={focused ? 'sr' : 'rr'}
                />
                <Text
                  style={{
                    color: tint,
                    fontSize: 10,
                    fontWeight: focused ? '700' : '600',
                    marginTop: 2,
                    writingDirection: isAppRtl() ? 'rtl' : 'ltr',
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}

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
                  style={[
                    styles.fab,
                    { borderColor: tokens.page },
                    ambientShadow(scheme, 'fab'),
                  ]}
                >
                  <AppIcon name="plus" variant="sr" size={ds.icon.fab} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={[styles.fab, styles.fabLuxury]}>
                  <AppIcon name="plus" variant="sr" size={ds.icon.fab + 2} color="#fff" />
                </View>
              )}
            </Pressable>
          </View>

          {rightTabs.map((tab) => {
            const focused = activeRoute === tab.route;
            const tint = focused ? activeTint : inactiveTint;
            return (
              <Pressable
                key={tab.route}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                onPress={() => onTabPress(tab.route, focused)}
                style={({ pressed }) => [
                  styles.tabSlot,
                  focused && !isLight && { backgroundColor: luxuryDark.accentSoft },
                  pressed && styles.pressed,
                ]}
              >
                <AppIcon
                  name={tab.icon}
                  size={ds.icon.tab}
                  color={tint}
                  variant={focused ? 'sr' : 'rr'}
                />
                <Text
                  style={{
                    color: tint,
                    fontSize: 10,
                    fontWeight: focused ? '700' : '600',
                    marginTop: 2,
                    writingDirection: isAppRtl() ? 'rtl' : 'ltr',
                  }}
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
    borderRadius: ds.radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  barLuxury: {
    backgroundColor: luxuryDark.tabGlass,
    borderColor: luxuryDark.border,
    borderRadius: 28,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: ds.radius.lg,
    paddingVertical: 4,
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
    borderRadius: ds.radius.fab,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  fabLuxury: {
    backgroundColor: luxuryDark.accent,
    borderColor: luxuryDark.bg,
    shadowColor: luxuryDark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  pressed: {
    transform: [{ scale: motion.pressScale }],
    opacity: 0.92,
  },
});
