import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ListingCard } from '@/components/feature/ListingCard';
import { AppFlatList } from '@/components/ui/AppFlatList';
import { FilterChip } from '@/components/ui/FilterChip';
import { ds } from '@/constants/designSystem';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { sarhScreenStyles } from '@/constants/sarhScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { compareListingBoostPriority, interleavePromotedListings } from '@/lib/listingSort';
import { getRtlRow, rtlBackIcon } from '@/lib/rtl';
import { listingMatchesMarketSelection } from '@/lib/marketCategoriesFallback';
import { safePush } from '@/lib/safeNavigate';
import { fetchMarketCategories } from '@/services/categories';
import {
  mergeListingPages,
  searchListingsPage,
} from '@/services/listings';
import { type Country, type Listing } from '@/services/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SortMode = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

const TAB_BAR_CLEARANCE = ds.tabBar.height + ds.tabBar.fabLift + ds.space.xxl + 16;
const LISTING_ROW_HEIGHT = 122;

export default function MarketBrowseScreen() {
  const params = useLocalSearchParams<{
    categoryId?: string;
    subcategoryId?: string;
    parentName?: string;
    parentEmoji?: string;
    subName?: string;
    subEmoji?: string;
  }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { styles, colors } = useThemedStyles(({ colors, scheme, sarh: screenStyles }) => ({
    styles: createStyles(colors, scheme, screenStyles),
    colors,
  }));

  const categoryId = typeof params.categoryId === 'string' ? params.categoryId : undefined;
  const subcategoryId =
    typeof params.subcategoryId === 'string' ? params.subcategoryId : undefined;
  const parentName = typeof params.parentName === 'string' ? params.parentName : '';
  const parentEmoji = typeof params.parentEmoji === 'string' ? params.parentEmoji : '';
  const subName = typeof params.subName === 'string' ? params.subName : '';
  const subEmoji = typeof params.subEmoji === 'string' ? params.subEmoji : '';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCountry, setActiveCountry] = useState<Country | 'ALL'>('ALL');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [items, setItems] = useState<Listing[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const searchParams = useMemo(
    () => ({
      categoryId,
      subcategoryId,
      search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
      country: activeCountry === 'ALL' ? undefined : activeCountry,
      featured: showFeaturedOnly || undefined,
    }),
    [activeCountry, categoryId, debouncedSearch, showFeaturedOnly, subcategoryId],
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const applyClientFilters = useCallback(
    async (listings: Listing[]) => {
      let next = listings.filter((l) => l.country !== 'EG');
      if (categoryId) {
        const tree = await fetchMarketCategories();
        const parent = tree.find((c) => c.id === categoryId);
        const sub =
          parent?.children?.find((c) => c.id === subcategoryId) ??
          tree.flatMap((p) => p.children ?? []).find((c) => c.id === subcategoryId);
        if (parent) {
          next = next.filter((l) => listingMatchesMarketSelection(l, parent, sub ?? null));
        }
      }
      return next;
    },
    [categoryId, subcategoryId],
  );

  const loadFirstPage = useCallback(async () => {
    if (!categoryId && !subcategoryId) {
      setItems([]);
      setNextCursor(null);
      setHasMore(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const page = await searchListingsPage(searchParams, accessToken);
      setItems(await applyClientFilters(page.listings));
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      setItems([]);
      setNextCursor(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [accessToken, applyClientFilters, categoryId, searchParams, subcategoryId]);

  const loadNextPage = useCallback(async () => {
    if (!hasMore || !nextCursor || loading || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await searchListingsPage(
        { ...searchParams, cursor: nextCursor },
        accessToken,
      );
      const extra = await applyClientFilters(page.listings);
      setItems((prev) => mergeListingPages(prev, extra));
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [accessToken, applyClientFilters, hasMore, loading, nextCursor, searchParams]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const filtered = useMemo(() => {
    let list = items.filter((l) => {
      if (showFeaturedOnly && !l.featured) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortMode === 'oldest') {
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      if (sortMode === 'price_asc') return a.price - b.price;
      if (sortMode === 'price_desc') return b.price - a.price;
      // newest + boost
      return compareListingBoostPriority(a, b);
    });

    return interleavePromotedListings(list);
  }, [items, showFeaturedOnly, sortMode]);

  const cycleSort = () => {
    setSortMode((prev) => {
      if (prev === 'newest') return 'oldest';
      if (prev === 'oldest') return 'price_asc';
      if (prev === 'price_asc') return 'price_desc';
      return 'newest';
    });
  };

  const sortLabel =
    sortMode === 'newest'
      ? 'الأحدث'
      : sortMode === 'oldest'
        ? 'الأقدم'
        : sortMode === 'price_asc'
          ? 'السعر ↑'
          : 'السعر ↓';

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

  const ListHeader = (
    <View>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.crumbShell}>
          <Text style={styles.crumb} numberOfLines={2}>
            السوق
            {parentName ? ` / ${parentEmoji ? `${parentEmoji} ` : ''}${parentName}` : ''}
            {subName ? ` / ${subEmoji ? `${subEmoji} ` : ''}${subName}` : ''}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <View style={[styles.searchRow, getRtlRow()]}>
        <Pressable
          style={[styles.filterStarBtn, showFeaturedOnly && styles.filterStarBtnActive]}
          onPress={() => setShowFeaturedOnly(!showFeaturedOnly)}
        >
          <AppIcon
            name="star"
            size={18}
            color={showFeaturedOnly ? colors.gold : colors.textPrimary}
            variant={showFeaturedOnly ? 'sr' : 'rr'}
          />
        </Pressable>
        <View style={[styles.searchBox, getRtlRow()]}>
          <AppIcon name="search" size={18} color={colors.textPrimary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث ضمن هذا التصنيف..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <AppIcon name="close-circle" size={16} color={colors.textPrimary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={[styles.filterRow, getRtlRow()]}>
        <FilterChip
          label="السعودية"
          selected={activeCountry === 'SA'}
          onPress={() => setActiveCountry(activeCountry === 'SA' ? 'ALL' : 'SA')}
        />
        <FilterChip label={sortLabel} icon="sort-alt" chevron onPress={cycleSort} />
      </View>

      <View style={[styles.countRow, getRtlRow()]}>
        <Text style={styles.count}>
          {loading ? 'جاري التحميل...' : `${filtered.length} إعلان${hasMore ? '+' : ''}`}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.electric} />
        </View>
      ) : (
        <AppFlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, index) => ({
            length: LISTING_ROW_HEIGHT,
            offset: LISTING_ROW_HEIGHT * index,
            index,
          })}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>لا توجد إعلانات في هذا التصنيف</Text>
            </View>
          }
          ListFooterComponent={
            <View style={{ height: TAB_BAR_CLEARANCE, alignItems: 'center', paddingTop: spacing.sm }}>
              {loadingMore ? <ActivityIndicator color={colors.electric} /> : null}
            </View>
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            void loadNextPage();
          }}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={8}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(
  colors: ThemeColors,
  scheme: 'light' | 'dark',
  screenStyles: ReturnType<typeof sarhScreenStyles>,
) {
  const isDark = scheme === 'dark';
  return StyleSheet.create({
    container: screenStyles.screenRoot,
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    backBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },
    crumbShell: {
      flex: 1,
      direction: 'ltr',
      minWidth: 0,
    },
    crumb: {
      ...typography.cardHeading,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    searchRow: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      alignItems: 'center',
    },
    filterStarBtn: {
      ...screenStyles.iconBtn,
    },
    filterStarBtnActive: {
      borderColor: colors.gold,
      backgroundColor: `${colors.gold}12`,
    },
    searchBox: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgElevated,
      borderRadius: 14,
      paddingHorizontal: spacing.md,
      minHeight: 44,
    },
    searchInput: {
      flex: 1,
      ...typography.secondary,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      textAlign: 'right',
    },
    filterRow: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
      alignItems: 'center',
    },
    countRow: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      justifyContent: 'flex-end',
    },
    count: {
      ...typography.caption,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
    empty: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md },
    emptyIcon: { fontSize: 40 },
    emptyText: {
      ...typography.body,
      color: colors.textMuted,
      writingDirection: 'rtl',
      textAlign: 'center',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
