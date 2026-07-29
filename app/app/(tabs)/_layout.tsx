// Powered by OnSpace.AI
// SAFAT — Tabs Layout

import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';
import { ds } from '@/constants/designSystem';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
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
      <Tabs.Screen name="posts" options={{ title: 'المنشورات' }} />
      <Tabs.Screen name="live" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: 'حسابي' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
