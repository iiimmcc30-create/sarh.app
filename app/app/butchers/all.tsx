import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
import { ButcherNearbyRow } from '@/components/butchers/ButcherNearbyRow';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import { ButcherProfile, mapButcherFromApi } from '@/services/butcherData';

export default function ButchersAllScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const { accessToken } = useAuth();
  const [butchers, setButchers] = useState<ButcherProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      } catch {
        /* fall back to rating */
      }

      const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const params = new URLSearchParams({ sort: lat != null && lng != null ? 'distance' : 'rating' });
      if (lat != null && lng != null) {
        params.set('lat', String(lat));
        params.set('lng', String(lng));
      }
      const res = await fetch(`${API_BASE}/api/butchers?${params.toString()}`, { headers });
      const json = await res.json().catch(() => ({}));
      const list = res.ok && json.success && Array.isArray(json.data?.butchers)
        ? json.data.butchers
            .filter((b: Record<string, unknown>) => (b.country || 'SA') !== 'EG')
            .map((b: Record<string, unknown>) => mapButcherFromApi(b))
        : [];
      setButchers(list);
    } catch {
      setButchers([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="الملاحم" showBack />
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.electric} />
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {butchers.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.rtlTextShell}>
                <Text style={styles.emptyTitle}>لا توجد ملاحم حالياً</Text>
              </View>
            </View>
          ) : (
            butchers.map((butcher, index) => (
              <ButcherNearbyRow
                key={butcher.id}
                butcher={butcher}
                onPress={() => router.push({ pathname: '/butchers/[id]', params: { id: butcher.id } })}
                showDivider={index < butchers.length - 1}
              />
            ))
          )}
        </ScrollView>
      )}
      <ButchersTabBar active="home" />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    flex: { flex: 1 },
    scroll: { paddingTop: spacing.sm, paddingBottom: spacing.xl },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: { paddingVertical: 80, paddingHorizontal: spacing.lg },
    rtlTextShell: { width: '100%', direction: 'ltr' },
    emptyTitle: {
      ...typography.body,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
  });
}
