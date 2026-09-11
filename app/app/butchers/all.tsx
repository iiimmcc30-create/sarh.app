import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
import { ButcherNearbyRow } from '@/components/butchers/ButcherNearbyRow';
import { AppText } from '@/design-system/components';
import { Screen, ScreenBody } from '@/design-system/layout';
import { space } from '@/design-system/tokens';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import { ButcherProfile, mapButcherFromApi } from '@/services/butcherData';
import { safePush } from '@/lib/safeNavigate';

export default function ButchersAllScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
    <Screen edges={['top']}>
      <ScreenHeader variant="screen" title="الملاحم" showBack />
      {loading ? (
        <ScreenBody scroll={false} gutter={false}>
          <View style={styles.loader}>
            <ActivityIndicator color={colors.electric} />
          </View>
        </ScreenBody>
      ) : (
        <ScreenBody gutter={false} padTop="sm" padBottom="lg">
          {butchers.length === 0 ? (
            <View style={styles.empty}>
              <View style={{ width: '100%' }}>
                <AppText variant="body" color="textMuted">
                  لا توجد ملاحم حالياً
                </AppText>
              </View>
            </View>
          ) : (
            butchers.map((butcher, index) => (
              <ButcherNearbyRow
                key={butcher.id}
                butcher={butcher}
                onPress={() =>
                  safePush({ pathname: '/butchers/[id]', params: { id: butcher.id } }, undefined, router)
                }
                showDivider={index < butchers.length - 1}
              />
            ))
          )}
        </ScreenBody>
      )}
      <ButchersTabBar active="stores" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingVertical: 80, paddingHorizontal: space[16] },
});
