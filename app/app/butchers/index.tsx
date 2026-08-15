// SAFAT — Butchers market home: banners · picks · nearby
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import { ButcherProfile, mapButcherFromApi } from '@/services/butcherData';
import { fetchButcherMarketBanners, type ButcherMarketBanner } from '@/services/butcherMarketBanners';
import { ButchersAppBar } from '@/components/butchers/ButchersAppBar';
import { ButcherLocationBar } from '@/components/butchers/ButcherLocationBar';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
import { ButcherMarketBannerSlider } from '@/components/butchers/ButcherMarketBannerSlider';
import { ButcherPickCard } from '@/components/butchers/ButcherPickCard';
import { ButcherNearbyRow } from '@/components/butchers/ButcherNearbyRow';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getRtlText } from '@/lib/rtl';
import { safePush, safeReplace } from '@/lib/safeNavigate';
import { useButcherCart } from '@/contexts/ButcherCartContext';

const SECTION_LIMIT = 12;

function filterButchers(list: ButcherProfile[], query: string): ButcherProfile[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (b) =>
      b.nameAr.includes(q) ||
      b.name.toLowerCase().includes(q) ||
      b.cityAr.includes(q) ||
      b.specialties.some((sp) => sp.includes(q)),
  );
}

export default function ButchersScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(({ colors }) => createScreenStyles(colors));
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { accessToken } = useAuth();
  const { itemCount, butcherId } = useButcherCart();
  const [picks, setPicks] = useState<ButcherProfile[]>([]);
  const [nearby, setNearby] = useState<ButcherProfile[]>([]);
  const [banners, setBanners] = useState<ButcherMarketBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const pickWidth = Math.round((screenWidth - spacing.lg * 2) * 0.72);

  const fetchSorted = useCallback(
    async (sort: 'rating' | 'distance'): Promise<ButcherProfile[]> => {
      const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const params = new URLSearchParams({ sort });
      if (sort === 'distance' && userCoords) {
        params.set('lat', String(userCoords.lat));
        params.set('lng', String(userCoords.lng));
      }
      const res = await fetch(`${API_BASE}/api/butchers?${params.toString()}`, { headers });
      if (!res.ok) return [];
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data?.butchers)) return [];
      return json.data.butchers
        .filter((b: Record<string, unknown>) => (b.country || 'SA') !== 'EG')
        .map((b: Record<string, unknown>) => mapButcherFromApi(b))
        .slice(0, SECTION_LIMIT);
    },
    [accessToken, userCoords],
  );

  useEffect(() => {
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({});
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        /* nearby falls back to rating order */
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [rated, near, promo] = await Promise.all([
          fetchSorted('rating'),
          fetchSorted('distance'),
          fetchButcherMarketBanners(),
        ]);
        if (cancelled) return;
        setPicks(rated);
        setNearby(near.length ? near : rated);
        setBanners(promo);
      } catch (err) {
        console.warn('[ButchersScreen] Failed to fetch home:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchSorted]);

  const filteredPicks = useMemo(() => filterButchers(picks, searchQuery), [picks, searchQuery]);
  const filteredNearby = useMemo(() => filterButchers(nearby, searchQuery), [nearby, searchQuery]);
  const openButcher = (id: string) =>
    safePush({ pathname: '/butchers/[id]', params: { id } }, undefined, router);

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView
        style={s.flex}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.stickyHeader}>
          <ButcherLocationBar />
          <ButchersAppBar
            onBack={() => safeReplace('/(tabs)', undefined, router)}
            onCart={() =>
              safePush(
                {
                  pathname: '/butchers/cart',
                  params: butcherId ? { butcherId } : {},
                },
                undefined,
                router,
              )
            }
            cartCount={itemCount}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </View>

        <ButcherMarketBannerSlider banners={banners} />

        {loading && picks.length === 0 ? (
          <View style={s.loader}>
            <ActivityIndicator color={colors.electricBright} />
          </View>
        ) : null}

        {!loading && searchQuery.trim() && filteredPicks.length === 0 && filteredNearby.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>لا توجد نتائج</Text>
            <Text style={s.emptySub}>جرّب كلمة بحث أخرى</Text>
          </View>
        ) : (
          <>
            <SectionHeader
              title="مختارات سرح"
              onSeeAll={() => safePush('/butchers/all', undefined, router)}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.picksRow}
            >
              {filteredPicks.map((butcher, i) => (
                <ButcherPickCard
                  key={butcher.id}
                  butcher={butcher}
                  width={pickWidth}
                  promoted={i < 2 || butcher.subscriptionActive}
                  onPress={() => openButcher(butcher.id)}
                />
              ))}
            </ScrollView>

            <SectionHeader
              title="الأقرب إليك"
              onSeeAll={() => safePush('/butchers/all', undefined, router)}
            />
            <View style={s.nearbyList}>
              {filteredNearby.map((butcher, index) => (
                <ButcherNearbyRow
                  key={butcher.id}
                  butcher={butcher}
                  onPress={() => openButcher(butcher.id)}
                  showDivider={index < filteredNearby.length - 1}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <ButchersTabBar active="home" />
    </SafeAreaView>
  );
}

function createScreenStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    flex: { flex: 1 },
    scroll: { paddingBottom: 20 },
    stickyHeader: { backgroundColor: colors.bgElevated },
    loader: { paddingVertical: 40, alignItems: 'center' },
    picksRow: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      gap: spacing.md,
    },
    nearbyList: { backgroundColor: colors.screenRoot, paddingBottom: spacing.sm },
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: spacing.sm },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, ...getRtlText() },
    emptySub: { ...typography.caption, color: colors.textMuted, ...getRtlText() },
  });
}
