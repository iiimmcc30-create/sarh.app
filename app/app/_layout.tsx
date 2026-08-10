// Powered by OnSpace.AI
// SAFAT — Root Layout

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from '@/contexts/OnboardingContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { ButcherOwnerProvider } from '@/contexts/ButcherOwnerContext';
import { NotificationManager } from '@/components/NotificationManager';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { BootSplashGate } from '@/components/ui/BootSplashGate';
import { ListingCovenantHost } from '@/components/listing/ListingCovenantHost';
import { ActionSheetHost } from '@/components/ui/ActionSheetHost';
import { ToastHost } from '@/components/ui/ToastHost';
import { SarhPatternBackground } from '@/components/ui/SarhPatternBackground';
import { sarh } from '@/constants/sarhTokens';
import { setupRtl, getRtlDirection, stackSlideAnimation, stackSlideBackAnimation, setupRtlFromStorage } from '@/lib/rtl';

setupRtl();

SplashScreen.preventAutoHideAsync().catch(() => {});

WebBrowser.maybeCompleteAuthSession();

export const unstable_settings = {
  initialRouteName: 'index',
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isComplete: onboardingComplete, isLoading: onboardingLoading } = useOnboarding();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading || onboardingLoading) return;

    if (segments[0] === 'expo-auth-session') return;

    const inOnboarding = (segments[0] as string) === 'onboarding';
    const inAuthGroup = segments[0] === 'auth';
    const inPublicInfo = segments[0] === 'info';

    if (!onboardingComplete && !inOnboarding) {
      router.replace('/onboarding' as any);
      return;
    }

    if (onboardingComplete && inOnboarding) {
      router.replace(isAuthenticated ? '/(tabs)' : '/auth/phone');
      return;
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)' as any);
      return;
    }

    if (!isAuthenticated && !inAuthGroup && !inPublicInfo && !inOnboarding) {
      router.replace('/auth/phone' as any);
    }
  }, [isAuthenticated, isLoading, onboardingComplete, onboardingLoading, segments, router]);

  return <>{children}</>;
}

function RootNavigator() {
  const { isDark, colors: themeColors } = useTheme();

  const stack = (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? 'transparent' : themeColors.bgDeep,
            ...getRtlDirection(),
          },
          animation: stackSlideAnimation(),
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="(butcher)" options={{ animation: 'none' }} />
        <Stack.Screen name="butchers" />
        <Stack.Screen name="listing/[id]" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="search" />
        <Stack.Screen name="users/[id]" />
        <Stack.Screen name="sidebar" options={{ animation: stackSlideBackAnimation(), presentation: 'transparentModal' }} />
        <Stack.Screen name="butcher-sidebar" options={{ animation: stackSlideBackAnimation(), presentation: 'transparentModal' }} />
        <Stack.Screen name="butchers-market-sidebar" options={{ animation: stackSlideBackAnimation(), presentation: 'transparentModal' }} />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="promote" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="fees" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="profile/connections" />
        <Stack.Screen name="create/listing" />
        <Stack.Screen name="create/post" />
        <Stack.Screen name="create/story" options={{ animation: stackSlideAnimation() }} />
        <Stack.Screen name="stories/view" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="info/about" />
        <Stack.Screen name="info/privacy" />
        <Stack.Screen name="info/terms" />
        <Stack.Screen name="info/contact" />
        <Stack.Screen name="info/refund" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/account" />
        <Stack.Screen name="settings/blocked" />
        <Stack.Screen name="settings/info" />
        <Stack.Screen name="settings/support" />
        <Stack.Screen name="support/index" />
        <Stack.Screen name="support/faq" />
        <Stack.Screen name="support/verification" />
        <Stack.Screen name="support/tickets/index" />
        <Stack.Screen name="support/tickets/create" />
        <Stack.Screen name="support/tickets/[id]" />
        <Stack.Screen name="onboarding/index" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="auth/phone" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth/otp" options={{ animation: stackSlideAnimation() }} />
        <Stack.Screen name="auth/register" options={{ animation: stackSlideAnimation() }} />
        <Stack.Screen name="auth/forgot-password" options={{ animation: stackSlideAnimation() }} />
        <Stack.Screen name="expo-auth-session" options={{ animation: 'none', headerShown: false }} />
        <Stack.Screen name="live/create" />
        <Stack.Screen name="live/broadcast" />
        <Stack.Screen name="live/watch/[id]" />
      </Stack>
    </>
  );

  if (isDark) {
    return <SarhPatternBackground>{stack}</SarhPatternBackground>;
  }

  return stack;
}

function RootLayoutBody() {
  useEffect(() => {
    void setupRtlFromStorage(AsyncStorage.getItem);
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={styles.rtlRoot}>
      <AuthProvider>
        <OnboardingProvider>
          <BootSplashGate>
            <AppProvider>
              <AuthGuard>
                <NotificationManager />
                <ButcherOwnerProvider>
                  <SubscriptionProvider>
                    <RootNavigator />
                    <ActionSheetHost />
                    <ListingCovenantHost />
                    <ToastHost />
                  </SubscriptionProvider>
                </ButcherOwnerProvider>
              </AuthGuard>
            </AppProvider>
          </BootSplashGate>
        </OnboardingProvider>
      </AuthProvider>
    </View>
  );
}

export default function RootLayout() {
  return (
    <View style={styles.rtlRoot}>
      <ThemeProvider>
        <RootLayoutBody />
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  rtlRoot: {
    flex: 1,
    backgroundColor: sarh.color.bg,
    ...getRtlDirection(),
  },
});
