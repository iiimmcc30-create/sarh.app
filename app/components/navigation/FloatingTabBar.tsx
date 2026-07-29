import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { ambientShadow, ds } from '@/constants/designSystem';
import { motion } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { isAppRtl } from '@/lib/rtl';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
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
  const router = useRouter();
  const { colors, gradients, scheme } = useTheme();
  const isLight = scheme === 'light';
  const tokens = isLight ? ds.light : ds.dark;
  const bottom = Math.max(insets.bottom, ds.tabBar.marginBottom);

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
          {
            backgroundColor: tokens.glass,
            borderColor: tokens.glassBorder,
          },
          ambientShadow(scheme, 'card'),
        ]}
      >
        <View style={styles.row}>
          {leftTabs.map((tab) => {
            const focused = activeRoute === tab.route;
            const tint = focused ? colors.electricBright : colors.textMuted;
            return (
              <Pressable
                key={tab.route}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                onPress={() => onTabPress(tab.route, focused)}
                style={({ pressed }) => [
                  styles.tabSlot,
                  focused && { backgroundColor: tokens.primaryMuted },
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
                    color: focused ? colors.electricBright : colors.textMuted,
                    fontSize: 10,
                    fontWeight: '600',
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
              onPress={() => router.push('/create/listing')}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
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
            </Pressable>
          </View>

          {rightTabs.map((tab) => {
            const focused = activeRoute === tab.route;
            const tint = focused ? colors.electricBright : colors.textMuted;
            return (
              <Pressable
                key={tab.route}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                onPress={() => onTabPress(tab.route, focused)}
                style={({ pressed }) => [
                  styles.tabSlot,
                  focused && { backgroundColor: tokens.primaryMuted },
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
                    color: focused ? colors.electricBright : colors.textMuted,
                    fontSize: 10,
                    fontWeight: '600',
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
    paddingVertical: 8,
    paddingHorizontal: 4,
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
    width: ds.tabBar.fabSize + 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -ds.tabBar.fabLift,
  },
  fab: {
    width: ds.tabBar.fabSize,
    height: ds.tabBar.fabSize,
    borderRadius: ds.radius.fab,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  pressed: {
    transform: [{ scale: motion.pressScale }],
    opacity: 0.92,
  },
});
