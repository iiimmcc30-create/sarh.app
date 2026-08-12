// Powered by OnSpace.AI
// SAFAT — Market Tab (السوق)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';

import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ds } from '@/constants/designSystem';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { sarhScreenStyles } from '@/constants/sarhScreen';
import { sarh } from '@/constants/sarhTokens';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow, getRtlDirection } from '@/lib/rtl';
import { compareListingBoostPriority, interleavePromotedListings } from '@/lib/listingSort';
import { ListingCard } from '@/components/feature/ListingCard';
import { AppFlatList } from '@/components/ui/AppFlatList';
import { safePush } from '@/lib/safeNavigate';
import { MarketCategoriesGrid } from '@/components/feature/MarketCategoriesGrid';
import { useApp } from '@/hooks/useApp';
import { Country, countries, Listing } from '@/services/types';
import {
  fetchMarketCategories,
  type MarketCategory,
} from '@/services/categories';

/** Card height 118 + vertical margins (2 + 2). */
const LISTING_ROW_HEIGHT = 122;
const TAB_BAR_CLEARANCE = ds.tabBar.height + ds.tabBar.fabLift + ds.space.xxl + 16;

export default function MarketScreen() {
  const router = useRouter();
  const { styles, colors } = useThemedStyles(({ colors, scheme, sarh: screenStyles }) => ({
    styles: createMarketStyles(colors, scheme, screenStyles),
    colors,
  }));
  const { listings, fetchListings } = useApp();
  const lastListingsFocusAt = useRef(0);

  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [search, setSearch] = useState('');
  const [activeCountry, setActiveCountry] = useState<Country | 'ALL'>('ALL');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastListingsFocusAt.current < 60_000) return;
      lastListingsFocusAt.current = now;
      void fetchListings();
    }, [fetchListings]),
  );

  useEffect(() => {
    let cancelled = false;
    fetchMarketCategories()
      .then((cats) => {
        if (!cancelled) setCategories(cats.filter((c) => !c.parentId && c.isActive));
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      interleavePromotedListings(
        listings
          .filter((l) => {
            if (l.country === 'EG') return false;
            if (activeCountry !== 'ALL' && l.country !== activeCountry) return false;
            if (showFeaturedOnly && !l.featured) return false;
            if (search.trim()) {
              const q = search.toLowerCase();
              return (
                l.title.toLowerCase().includes(q) ||
                l.arabicTitle.includes(q) ||
                l.arabicLocation.includes(q)
              );
            }
            return true;
          })
          .sort(compareListingBoostPriority),
      ),
    [listings, activeCountry, showFeaturedOnly, search],
  );

  const onSelectCategory = useCallback(
    (cat: MarketCategory) => {
      safePush(
        { pathname: '/market/categories/[id]', params: { id: cat.id } },
        undefined,
        router,
      );
    },
    [router],
  );

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

  const keyExtractor = useCallback((item: Listing) => item.id, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: LISTING_ROW_HEIGHT,
      offset: LISTING_ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  const ListEmpty = useMemo(
    () => (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyText}>لا توجد إعلانات مطابقة</Text>
      </View>
    ),
    [styles.empty, styles.emptyIcon, styles.emptyText],
  );

  const ListHeader = useCallback(
    () => (
      <View>
        <View style={[styles.pageHeader, getRtlRow()]}>
          <View style={styles.pageTitleBlock}>
            <Text style={styles.pageTitle}>السوق</Text>
            <Text style={styles.pageSubtitle}>اكتشف أحدث الإعلانات من مجتمع سرح</Text>
          </View>
          <View style={[styles.headerActions, getRtlRow()]}>
            <NotificationBellButton size={ds.iconBtn.md} iconSize={ds.icon.md} style={styles.headerIconBtn} />
            <Pressable
              style={styles.headerIconBtn}
              hitSlop={8}
              onPress={() => safePush('/search', undefined, router)}
            >
              <AppIcon name="search" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
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
              placeholder="ابحث في السوق"
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

        {categories.length > 0 ? (
          <MarketCategoriesGrid categories={categories} onSelect={onSelectCategory} />
        ) : null}

        <View style={[styles.filterRow, getRtlRow()]}>
          <Pressable
            style={[styles.filterChip, getRtlRow(), activeCountry === 'SA' && styles.filterChipActive]}
            onPress={() => setActiveCountry(activeCountry === 'SA' ? 'ALL' : 'SA')}
          >
            <Text style={styles.filterFlag}>{countries.SA.flag}</Text>
            <Text style={[styles.filterChipText, activeCountry === 'SA' && styles.filterChipTextActive]}>
              السعودية
            </Text>
          </Pressable>
          <View style={[styles.filterChip, getRtlRow()]}>
            <Text style={styles.filterChipText}>الأحدث</Text>
            <AppIcon name="sort-alt" size={14} color={colors.textSecondary} />
          </View>
        </View>

        <View style={styles.sectionTitleShell}>
          <Text style={styles.sectionTitle}>أحدث الإعلانات</Text>
        </View>

        <View style={[styles.countRow, getRtlRow()]}>
          <Text style={styles.count}>{filtered.length} إعلان</Text>
        </View>
      </View>
    ),
    [
      activeCountry,
      categories,
      colors,
      filtered.length,
      onSelectCategory,
      router,
      search,
      showFeaturedOnly,
      styles,
    ],
  );

  return (
    <SafeAreaView style={[styles.container, getRtlDirection()]} edges={['top']}>
      <AppFlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={<View style={{ height: TAB_BAR_CLEARANCE }} />}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={8}
      />
    </SafeAreaView>
  );
}

function createMarketStyles(
  colors: ThemeColors,
  scheme: 'light' | 'dark',
  screenStyles: ReturnType<typeof sarhScreenStyles>,
) {
  const isDark = scheme === 'dark';
  return StyleSheet.create({
    container: screenStyles.screenRoot,
    pageHeader: {
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.md,
    },
    pageTitleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    pageTitle: {
      ...typography.h1,
      fontWeight: '600',
      color: colors.textPrimary,
      writingDirection: 'rtl',
    },
    pageSubtitle: {
      ...typography.caption,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
    headerActions: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerIconBtn: {
      ...screenStyles.iconBtn,
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
      borderWidth: 0,
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      fontSize: 14,
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
    filterChip: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      minHeight: 36,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
      borderWidth: 0,
    },
    filterChipActive: {
      backgroundColor: isDark ? sarh.color.action : colors.electric,
      borderColor: isDark ? sarh.color.action : colors.electric,
    },
    filterChipText: {
      ...typography.caption,
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      writingDirection: 'rtl',
    },
    filterChipTextActive: {
      color: '#fff',
    },
    filterFlag: {
      fontSize: 14,
    },
    sectionTitleShell: {
      width: '100%',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      direction: 'ltr',
    },
    sectionTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    countRow: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      justifyContent: 'flex-end',
    },
    count: {
      ...typography.caption,
      fontSize: 12,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
    empty: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md },
    emptyIcon: { fontSize: 40 },
    emptyText: { ...typography.body, color: colors.textMuted },
  });
}
