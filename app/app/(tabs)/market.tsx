// Powered by OnSpace.AI
// SAFAT — Market Tab (السوق)
import { MarketAppBar } from '@/components/market/MarketAppBar';
import { MarketCategoryNav } from '@/components/market/MarketCategoryNav';
import { MarketFilterBar } from '@/components/market/MarketFilterBar';
import { RegionCityPicker } from '@/components/market/RegionCityPicker';

import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ds } from '@/constants/designSystem';
import type { RegionSelection } from '@/constants/saudiRegions';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { sarhScreenStyles } from '@/constants/sarhScreen';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlDirection, getRtlRow } from '@/lib/rtl';
import { compareListingBoostPriority, interleavePromotedListings } from '@/lib/listingSort';
import { listingMatchesMarketSelection } from '@/lib/marketCategoriesFallback';
import { listingMatchesRegionSelection } from '@/lib/saudiRegionSearch';
import { ListingCard } from '@/components/feature/ListingCard';
import { AppFlatList } from '@/components/ui/AppFlatList';
import { safePush } from '@/lib/safeNavigate';
import { useMarketCategories } from '@/hooks/useMarketCategories';
import { useApp } from '@/hooks/useApp';
import { Listing } from '@/services/types';
import type { MarketCategory } from '@/services/categories';

const TAB_BAR_CLEARANCE = ds.tabBar.height + ds.tabBar.fabLift + ds.space.xxl + 16;

type SortMode = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

export default function MarketScreen() {
  const router = useRouter();
  const { styles } = useThemedStyles(({ colors, scheme, sarh: screenStyles }) => ({
    styles: createMarketStyles(colors, scheme, screenStyles),
  }));
  const { listings, fetchListings } = useApp();
  const { categories, loading: categoriesLoading, reload: reloadCategories } = useMarketCategories();
  const lastListingsFocusAt = useRef(0);
  const listRef = useRef<FlatList<Listing>>(null);

  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [regionSelection, setRegionSelection] = useState<RegionSelection>({ type: 'all' });
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  useFocusEffect(
    useCallback(() => {
      void reloadCategories();
      const now = Date.now();
      if (now - lastListingsFocusAt.current < 60_000) return;
      lastListingsFocusAt.current = now;
      void fetchListings();
    }, [fetchListings, reloadCategories]),
  );

  const activeParent = useMemo(
    () => categories.find((c) => c.id === activeParentId) ?? null,
    [categories, activeParentId],
  );
  const activeSub = useMemo(() => {
    if (!activeSubId || !activeParent) return null;
    return activeParent.children?.find((c) => c.id === activeSubId) ?? null;
  }, [activeParent, activeSubId]);

  const onSelectParent = useCallback((cat: MarketCategory | null) => {
    setActiveParentId(cat?.id ?? null);
    setActiveSubId(null);
  }, []);

  const onSelectSub = useCallback((sub: MarketCategory | null) => {
    setActiveSubId(sub?.id ?? null);
  }, []);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [activeParentId, activeSubId]);

  const filtered = useMemo(() => {
    let list = listings.filter((l) => {
      if (l.country === 'EG') return false;
      if (showFeaturedOnly && !l.featured) return false;
      if (activeParent && !listingMatchesMarketSelection(l, activeParent, activeSub)) {
        return false;
      }
      if (
        !listingMatchesRegionSelection(l.arabicLocation || l.location || '', regionSelection)
      ) {
        return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortMode === 'oldest') return (a.createdAt || '').localeCompare(b.createdAt || '');
      if (sortMode === 'price_asc') return a.price - b.price;
      if (sortMode === 'price_desc') return b.price - a.price;
      return compareListingBoostPriority(a, b);
    });

    return interleavePromotedListings(list);
  }, [listings, showFeaturedOnly, activeParent, activeSub, regionSelection, sortMode]);

  const sortLabel =
    sortMode === 'newest'
      ? 'الأحدث'
      : sortMode === 'oldest'
        ? 'الأقدم'
        : sortMode === 'price_asc'
          ? 'السعر ↑'
          : 'السعر ↓';

  const cycleSort = () => {
    setSortMode((prev) => {
      if (prev === 'newest') return 'oldest';
      if (prev === 'oldest') return 'price_asc';
      if (prev === 'price_asc') return 'price_desc';
      return 'newest';
    });
  };

  const onNearby = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('إذن الموقع', 'يرجى السماح بالوصول للموقع لعرض الإعلانات القريبة');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const city = geo?.city || geo?.subregion || geo?.region;
      if (!city) {
        Alert.alert('الموقع', 'تعذّر تحديد مدينتك');
        return;
      }
      setRegionSelection({
        type: 'city',
        region: {
          id: 'nearby',
          nameAr: 'بالقرب منك',
          nameEn: 'Nearby',
          cities: [{ id: 'nearby-city', nameAr: city, nameEn: city }],
        },
        city: { id: 'nearby-city', nameAr: city, nameEn: city },
      });
    } catch {
      Alert.alert('خطأ', 'تعذّر الحصول على موقعك');
    }
  };

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Listing>) => (
      <ListingCard
        listing={item}
        variant="list"
        listMode="market"
        onPress={() =>
          safePush({ pathname: '/listing/[id]', params: { id: item.id } }, undefined, router)
        }
      />
    ),
    [router],
  );

  const ListHeader = useCallback(
    () => (
      <View style={styles.listingsHead}>
        <View style={[styles.listingsHeadRow, getRtlRow()]}>
          <View style={styles.listingsTitleShell}>
            <Text style={styles.listingsTitle}>أحدث الإعلانات</Text>
          </View>
          <View style={styles.listingsCountShell}>
            <Text style={styles.listingsCount}>{filtered.length} إعلان</Text>
          </View>
        </View>
      </View>
    ),
    [filtered.length, styles],
  );

  return (
    <SafeAreaView style={[styles.container, getRtlDirection()]} edges={['top']}>
      <MarketAppBar
        onMenu={() => safePush('/sidebar', undefined, router)}
        onSearch={() => safePush('/search', undefined, router)}
      />

      {categories.length > 0 ? (
        <MarketCategoryNav
          categories={categories}
          activeParentId={activeParentId}
          activeSubId={activeSubId}
          onSelectParent={onSelectParent}
          onSelectSub={onSelectSub}
        />
      ) : categoriesLoading ? (
        <View style={styles.categoriesLoading}>
          <Text style={styles.categoriesLoadingText}>جاري تحميل التصنيفات...</Text>
        </View>
      ) : null}

      <MarketFilterBar
        regionSelection={regionSelection}
        onRegionPress={() => setRegionPickerOpen(true)}
        onFilterPress={() => setShowFeaturedOnly((v) => !v)}
        onNearbyPress={() => void onNearby()}
        onSortPress={cycleSort}
        sortLabel={sortLabel}
        filterActive={showFeaturedOnly}
      />

      <AppFlatList
        ref={listRef}
        style={styles.list}
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>لا توجد إعلانات مطابقة</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: TAB_BAR_CLEARANCE }} />}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={8}
      />

      <RegionCityPicker
        visible={regionPickerOpen}
        selection={regionSelection}
        onClose={() => setRegionPickerOpen(false)}
        onSelect={setRegionSelection}
      />
    </SafeAreaView>
  );
}

function createMarketStyles(
  colors: ThemeColors,
  _scheme: 'light' | 'dark',
  screenStyles: ReturnType<typeof sarhScreenStyles>,
) {
  return StyleSheet.create({
    container: screenStyles.screenRoot,
    list: {
      flex: 1,
    },
    listingsHead: {
      width: '100%',
      direction: 'ltr',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    listingsHeadRow: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    listingsTitleShell: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
    },
    listingsTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    listingsCountShell: {
      direction: 'ltr',
      flexShrink: 0,
    },
    listingsCount: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    categoriesLoading: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    categoriesLoadingText: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    empty: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md },
    emptyIcon: { fontSize: 40 },
    emptyText: { ...typography.body, color: colors.textMuted },
  });
}
