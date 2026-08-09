// Powered by OnSpace.AI
// SAFAT — Butchers Section Layout

import { Stack } from 'expo-router';
import { ButcherCartProvider } from '@/contexts/ButcherCartContext';
import { useTheme } from '@/hooks/useTheme';
import { getRtlDirection } from '@/lib/rtl';

export default function ButchersLayout() {
  const { colors, scheme } = useTheme();

  return (
    <ButcherCartProvider>
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: scheme === 'dark' ? 'transparent' : colors.bgDeep, ...getRtlDirection() },
        animation: 'slide_from_left',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="order" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="order-success" options={{ animation: 'fade' }} />
      <Stack.Screen name="chat" />
      <Stack.Screen name="register" />
      <Stack.Screen name="apply" />
      <Stack.Screen name="my-application" />
      <Stack.Screen name="application/[id]" />
      <Stack.Screen name="application/edit/[id]" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="manage" />
      <Stack.Screen name="map" />
      <Stack.Screen name="my-orders" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="invoices" />
      <Stack.Screen name="invoice/[id]" />
      <Stack.Screen
        name="story-viewer"
        options={{ animation: 'fade', presentation: 'transparentModal' }}
      />
    </Stack>
    </ButcherCartProvider>
  );
}
