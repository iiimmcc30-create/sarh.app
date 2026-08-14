import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRtlDirection } from '@/lib/rtl';

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: string;
  color: string;
  focused?: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <AppIcon name={name} variant={focused ? 'sr' : 'rr'} size={focused ? 22 : 20} color={color} />
    </View>
  );
}

export default function ButcherTabsLayout() {
  const insets = useSafeAreaInsets();
  const padBottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#20B66F',
        tabBarInactiveTintColor: '#94A3AC',
        tabBarHideOnKeyboard: true,
        tabBarLabel: ({ focused, children }) => (
          <Text
            style={{
              color: focused ? '#20B66F' : '#94A3AC',
              fontSize: 10,
              fontWeight: focused ? '700' : '600',
              writingDirection: 'rtl',
            }}
          >
            {children}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: '#0B1622',
          borderTopColor: 'rgba(150,175,185,0.18)',
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 56 + padBottom,
          paddingTop: 6,
          paddingBottom: padBottom,
          elevation: 0,
          shadowOpacity: 0,
          ...getRtlDirection(),
        },
        tabBarItemStyle: { paddingTop: 2 },
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: '#0B1622' }} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'التحليلات',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="bar-chart-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: 'إدارة الملحمة',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="storefront-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'الرسائل',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="chatbubbles-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="person-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 42,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
