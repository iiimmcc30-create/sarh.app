// Powered by OnSpace.AI
// SAFAT — Tabs Layout

import { Tabs } from 'expo-router';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { ds } from '@/constants/designSystem';
import { sarh } from '@/constants/sarhTokens';
import { useTheme } from '@/hooks/useTheme';

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const sceneBg = isDark ? colors.bgDeep || sarh.color.bg : colors.bgDeep;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: sceneBg },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: ds.tabBar.height + ds.tabBar.fabLift + 24,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="market" options={{ title: 'السوق' }} />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          href: null,
        }}
      />
      <Tabs.Screen name="posts" options={{ href: null }} />
      <Tabs.Screen name="live" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ title: 'الرسائل' }} />
      <Tabs.Screen name="profile" options={{ title: 'حسابي' }} />
    </Tabs>
  );
}
