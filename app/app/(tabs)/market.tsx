// Powered by OnSpace.AI
// SAFAT — Market Tab (السوق)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';

import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ambientShadow, ds } from '@/constants/designSystem';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { sarhScreenStyles } from '@/constants/sarhScreen';
import { sarh } from '@/constants/sarhTokens';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow, getRtlDirection, getRtlText } from '@/lib/rtl';
import { compareListingBoostPriority, interleavePromotedListings } from '@/lib/listingSort';
import { ListingCard } from '@/components/feature/ListingCard';
import { AppFlatList } from '@/components/ui/AppFlatList';
import { safePush } from '@/lib/safeNavigate';
import { MarketCategoryTiles } from '@/components/feature/MarketCategoryTiles';
import { useApp } from '@/hooks/useApp';
import { Country, countries, Listing } from '@/services/types';

const LISTING_ROW_HEIGHT = 156;
const TAB_BAR_CLEARANCE = ds.tabBar.height + ds.tabBar.fabLift + ds.space.xxl + 16;

export default function MarketScreen() {
  const router = useRouter();
  const { styles, colors } = useThemedStyles(({ colors, scheme, sarh: screenStyles }) => ({
    styles: createMarketStyles(colors, scheme, screenStyles),
    colors,
  }));
  const { listings, fetchListings } = useApp();
  const lastListingsFocusAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastListingsFocusAt.current < 60_000) return;
      lastListingsFocusAt.current = now;
      void fetchListings();
    }, [fetchListings]),
  );
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeCountry, setActiveCountry] = useState<Country | 'ALL'>('ALL');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const filtered = useMemo(
    () =>
      interleavePromotedListings(
        listings
          .filter((l) => {
            if (l.country === 'EG') return false;
            if (activeCategory !== 'all' && l.category !== activeCategory) return false;
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
    [listings, activeCategory, activeCountry, showFeaturedOnly, search],
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
              color={showFeaturedOnly ? colors.gold : colors.textMuted}
              variant={showFeaturedOnly ? 'sr' : 'rr'}
            />
          </Pressable>
          <View style={[styles.searchBox, getRtlRow()]}>
            <AppIcon name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="ابحث عن حيوانات، أعلاف، منتجات..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <AppIcon name="close-circle" size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <MarketCategoryTiles value={activeCategory} onChange={setActiveCategory} />

        <View style={[styles.filterRow, getRtlRow()]}>
          <Pressable
            style={styles.filterChip}
            onPress={() => setShowFeaturedOnly(!showFeaturedOnly)}
          >
            <AppIcon name="settings-sliders" size={16} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={[styles.filterChip, getRtlRow()]}>
            <AppIcon name="map-marker-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.filterChipText}>الموقع</Text>
          </Pressable>
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

        <View style={[styles.countRow, getRtlRow()]}>
          <Text style={styles.count}>{filtered.length} إعلان</Text>
        </View>
      </View>
    ),
    [
      activeCategory,
      activeCountry,
      filtered.length,
      search,
      showFeaturedOnly,
      styles,
      colors,
      router,
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
  const tokens = scheme === 'light' ? ds.light : ds.dark;
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
      ...getRtlText(),
    },
    pageSubtitle: {
      ...typography.caption,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
      ...getRtlText(),
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
      backgroundColor: isDark ? sarh.color.surface : colors.bgSurface,
      borderRadius: ds.radius.lg,
      paddingHorizontal: spacing.md,
      minHeight: 44,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? sarh.color.border : tokens.stroke,
      ...ambientShadow(scheme, 'soft'),
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      fontSize: 14,
      color: colors.textPrimary,
      ...getRtlText(),
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
      borderRadius: radius.pill,
      backgroundColor: isDark ? sarh.color.surface : colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? sarh.color.border : tokens.stroke,
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
      ...getRtlText(),
    },
    filterChipTextActive: {
      color: '#fff',
    },
    filterFlag: {
      fontSize: 14,
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
      ...getRtlText(),
    },
    empty: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md },
    emptyIcon: { fontSize: 40 },
    emptyText: { ...typography.body, color: colors.textMuted },
  });
}
