// SAFAT — Unified Search Screen (البحث)
import { Image, uriSource } from '@/components/ui/AppImage';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { UserIdentityRow, USER_IDENTITY } from '@/components/ui/UserIdentityRow';
import { ListingCard } from '@/components/feature/ListingCard';
import { AppChromeLayer } from '@/components/navigation/AppChromeLayer';
import { HomeAppBar, shellIdentityStackH } from '@/components/ui/HomeAppBar';
import { useAuth } from '@/contexts/AuthContext';
import { cloudinaryFitUrl } from '@/lib/listingMedia';
import { openPostDetail } from '@/lib/openPost';
import { safePush } from '@/lib/safeNavigate';
import { AppText, SarhBackButton, SarhChipRow, SarhInput } from '@/design-system/components';
import { Row, Screen, ScreenBody, Stack } from '@/design-system/layout';
import { useAppChromeScroll } from '@/hooks/useAppChrome';
import { useAppUser } from '@/hooks/useApp';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useLayout } from '@/hooks/useLayout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { ensureApiReachable } from '@/services/api';
import {
  fetchSearchSuggestions,
  fetchTrendingTags,
  mapListingFromSearch,
  unifiedSearch,
  type SearchContentType,
  type SearchGroup,
  type SearchResultItem,
} from '@/services/unifiedSearch';
import { ds } from '@/constants/designSystem';
import { type ThemeColors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RECENT_KEY = 'safat_recent_searches';
const MIN_QUERY = 2;

type SearchFilter = SearchContentType;

const RESULT_SECTIONS: { id: SearchFilter; label: string }[] = [
  { id: 'all', label: 'الأحدث' },
  { id: 'users', label: 'الأشخاص' },
  { id: 'listings', label: 'الإعلانات' },
  { id: 'posts', label: 'المنشورات' },
  { id: 'news', label: 'الأخبار' },
  { id: 'services', label: 'الخدمات' },
];

type ExploreSection = 'explore' | 'trending' | 'news' | 'services';

const EXPLORE_SECTIONS: { id: ExploreSection; label: string }[] = [
  { id: 'explore', label: 'استكشف' },
  { id: 'trending', label: 'الأكثر تداولاً' },
  { id: 'news', label: 'الأخبار' },
  { id: 'services', label: 'الخدمات' },
];

type SearchScreenProps = {
  variant?: 'stack' | 'tab';
};

export default function SearchScreen({ variant = 'stack' }: SearchScreenProps) {
  const { colors } = useTheme();
  const { gutter, width } = useLayout();
  const styles = useThemedStyles(({ colors: c, scheme }) => createStyles(c, scheme));
  const router = useRouter();
  const { q: qParam } = useLocalSearchParams<{ q?: string }>();
  const resultTabWidth = Math.max(72, (width - gutter * 2) / 5.15);
  const { onChromeScroll } = useAppChromeScroll();
  const { me } = useAppUser();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const isTab = variant === 'tab';
  const [headerH, setHeaderH] = useState(() => shellIdentityStackH(insets.top) + 40);
  const [section, setSection] = useState<ExploreSection>('explore');
  const displayName = isAuthenticated
    ? me.arabicName || me.displayName || me.username || 'حسابي'
    : 'ضيف';

  const openSidebar = useCallback(() => {
    if (!isAuthenticated) {
      safePush('/auth/phone', undefined, router);
      return;
    }
    safePush('/sidebar', undefined, router);
  }, [isAuthenticated, router]);

  const initialQuery =
    !isTab && typeof qParam === 'string' ? qParam : '';
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query.trim(), 350);
  const [filter, setFilter] = useState<SearchFilter>('all');

  const selectSection = useCallback((next: ExploreSection) => {
    setSection(next);
    if (next === 'news') setFilter('news');
    else if (next === 'services') setFilter('services');
    else setFilter('all');
  }, []);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingTags, setTrendingTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [suggestions, setSuggestions] = useState<Array<{ text: string; kind: string }>>([]);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featuredUsers, setFeaturedUsers] = useState<
    Array<{ id: string; username: string; arabicName?: string; displayName?: string; avatar?: string; verified?: boolean; followers?: number }>
  >([]);

  const searchSeq = useRef(0);

  useEffect(() => {
    fetchTrendingTags().then(setTrendingTags).catch(() => {});
    AsyncStorage.getItem(RECENT_KEY)
      .then((val) => {
        if (val) setRecentSearches(JSON.parse(val));
      })
      .catch(() => {});

    (async () => {
      try {
        const base = await ensureApiReachable();
        const res = await fetch(`${base}/api/users`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setFeaturedUsers(json.data.slice(0, 4));
        }
      } catch {
        /* optional idle content */
      }
    })();
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY) {
      setSuggestions([]);
      setGroups([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetchSearchSuggestions(debouncedQuery)
      .then((items) => {
        if (!cancelled) setSuggestions(items);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    if (isTab) return;
    const next = typeof qParam === 'string' ? qParam : '';
    if (next) setQuery(next);
  }, [isTab, qParam]);

  useEffect(() => {
    if (isTab || debouncedQuery.length < MIN_QUERY) return;

    const seq = ++searchSeq.current;
    setLoading(true);
    setError(null);

    unifiedSearch({ q: debouncedQuery, type: filter, limit: filter === 'all' ? 8 : 20 })
      .then((res) => {
        if (seq !== searchSeq.current) return;
        setGroups(res.groups);
      })
      .catch((err: unknown) => {
        if (seq !== searchSeq.current) return;
        setError(err instanceof Error ? err.message : 'تعذّر إكمال البحث');
      })
      .finally(() => {
        if (seq === searchSeq.current) setLoading(false);
      });
  }, [debouncedQuery, filter, isTab]);

  const saveRecent = useCallback((searches: string[]) => {
    setRecentSearches(searches);
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(searches)).catch(() => {});
  }, []);

  const addRecentSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (trimmed.length < MIN_QUERY) return;
      const updated = [trimmed, ...recentSearches.filter((r) => r !== trimmed)].slice(0, 10);
      saveRecent(updated);
    },
    [recentSearches, saveRecent],
  );

  const openResults = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (trimmed.length < MIN_QUERY) return;
      addRecentSearch(trimmed);
      if (isTab) {
        safePush({ pathname: '/search', params: { q: trimmed } }, { force: true }, router);
        return;
      }
      setQuery(trimmed);
    },
    [addRecentSearch, isTab, router],
  );

  const applyQuery = useCallback(
    (term: string) => {
      if (isTab) {
        openResults(term);
        return;
      }
      setQuery(term);
      addRecentSearch(term);
    },
    [addRecentSearch, isTab, openResults],
  );

  const hasQuery = query.trim().length > 0;
  const canSearch = debouncedQuery.length >= MIN_QUERY;

  const visibleGroups = useMemo(() => {
    if (filter === 'all') return groups;
    return groups.filter((g) => g.type === filter);
  }, [groups, filter]);

  const latestItems = useMemo(() => {
    return groups
      .flatMap((group) => group.items)
      .slice()
      .sort((a, b) => {
        const left = a.createdAt ? Date.parse(a.createdAt) : 0;
        const right = b.createdAt ? Date.parse(b.createdAt) : 0;
        return right - left;
      });
  }, [groups]);

  const totalResults = useMemo(() => {
    if (filter === 'all') return latestItems.length;
    return visibleGroups.reduce((n, g) => n + g.items.length, 0);
  }, [filter, latestItems.length, visibleGroups]);

  const renderResult = (item: SearchResultItem) => {
    switch (item.type) {
      case 'listings': {
        const listing = mapListingFromSearch(item.data);
        if (!listing) return null;
        return (
          <ListingCard
            key={`listing-${item.id}`}
            listing={listing}
            variant="grid"
            onPress={() => router.push({ pathname: '/listing/[id]', params: { id: item.id } })}
          />
        );
      }
      case 'butchers':
        return (
          <Pressable
            key={`butcher-${item.id}`}
            style={styles.resultRow}
            onPress={() => router.push({ pathname: '/butchers/[id]', params: { id: item.id } } as never)}
          >
            <Row gap="md" align="center">
            {item.imageUrl ? (
              <Image source={uriSource(cloudinaryFitUrl(item.imageUrl, 'row'))} style={styles.resultThumb} contentFit="cover" />
            ) : (
              <View style={[styles.resultThumb, styles.resultThumbPlaceholder]}>
                <AppIcon name="store" size={20} color={colors.textMuted} />
              </View>
            )}
            <Stack gap="xs" style={styles.resultBody}>
              <AppText variant="body" numberOfLines={2}>{item.title}</AppText>
              {item.subtitle ? (
                <AppText variant="caption" color="textMuted" numberOfLines={1}>{item.subtitle}</AppText>
              ) : null}
            </Stack>
            </Row>
          </Pressable>
        );
      case 'news':
        return (
          <Pressable
            key={`news-${item.id}`}
            style={styles.resultRow}
            onPress={() => router.push('/news' as never)}
          >
            <Row gap="md" align="center">
            {item.imageUrl ? (
              <Image source={uriSource(cloudinaryFitUrl(item.imageUrl, 'row'))} style={styles.resultThumb} contentFit="cover" />
            ) : null}
            <Stack gap="xs" style={styles.resultBody}>
              <AppText variant="body" numberOfLines={2}>{item.title}</AppText>
              {item.subtitle ? (
                <AppText variant="caption" color="textMuted" numberOfLines={2}>{item.subtitle}</AppText>
              ) : null}
            </Stack>
            </Row>
          </Pressable>
        );
      case 'services':
        return (
          <Pressable
            key={`service-${item.id}`}
            style={styles.resultRow}
            onPress={() =>
              router.push({ pathname: '/ministry/services/[id]', params: { id: item.id } } as never)
            }
          >
            <Row gap="md" align="center">
            <View style={[styles.resultThumb, styles.resultThumbPlaceholder]}>
              <AppIcon name="briefcase" size={20} color={colors.textMuted} />
            </View>
            <Stack gap="xs" style={styles.resultBody}>
              <AppText variant="body" numberOfLines={2}>{item.title}</AppText>
              {item.subtitle ? (
                <AppText variant="caption" color="textMuted" numberOfLines={1}>{item.subtitle}</AppText>
              ) : null}
            </Stack>
            </Row>
          </Pressable>
        );
      case 'users': {
        const user = item.data as {
          id?: string;
          username?: string;
          arabicName?: string;
          displayName?: string;
          avatar?: string;
          verified?: boolean;
        };
        return (
          <UserIdentityRow
            key={`user-${item.id}`}
            avatarUri={user.avatar ?? item.imageUrl}
            displayName={user.arabicName || user.displayName || user.username || item.title}
            username={user.username}
            verified={user.verified}
            avatarSize={USER_IDENTITY.listAvatarSize}
            avatarRadius={USER_IDENTITY.listAvatarRadius}
            avatarBorderWidth={USER_IDENTITY.listAvatarBorder}
            nameLines={2}
            onPress={() => router.push({ pathname: '/users/[id]', params: { id: item.id } } as never)}
            style={styles.userRow}
          />
        );
      }
      case 'posts':
        return (
          <Pressable
            key={`post-${item.id}`}
            style={styles.resultRow}
            onPress={() => openPostDetail(router, item.id)}
          >
            <Row gap="md" align="center">
            {item.imageUrl ? (
              <Image source={uriSource(cloudinaryFitUrl(item.imageUrl, 'row'))} style={styles.resultThumb} contentFit="cover" />
            ) : (
              <View style={[styles.resultThumb, styles.resultThumbPlaceholder]}>
                <AppIcon name="file-text" size={20} color={colors.textMuted} />
              </View>
            )}
            <Stack gap="xs" style={styles.resultBody}>
              <AppText variant="body" numberOfLines={3}>{item.title}</AppText>
              {item.subtitle ? (
                <AppText variant="caption" color="textMuted" numberOfLines={1}>{item.subtitle}</AppText>
              ) : null}
            </Stack>
            </Row>
          </Pressable>
        );
      default:
        return null;
    }
  };

  const searchField = (
    <SarhInput
      value={query}
      onChangeText={setQuery}
      placeholder="بحث"
      autoFocus={!isTab}
      returnKeyType="search"
      onSubmitEditing={() => openResults(query)}
      leadingIcon="search"
      trailingIcon={hasQuery ? 'close-circle' : undefined}
      onTrailingPress={hasQuery ? () => setQuery('') : undefined}
      shape="pill"
      accessibilityRole="search"
      accessibilityLabel={hasQuery ? 'مسح البحث' : 'بحث'}
      containerStyle={styles.inputFlex}
    />
  );

  const trendingBlock = (
    <Stack gap="md" style={styles.section}>
      <AppText variant="heading3">🔥 الأكثر تداولاً</AppText>
      {trendingTags.length === 0 ? (
        <AppText variant="caption" color="textMuted">لا توجد هاشتاقات رائجة حالياً</AppText>
      ) : (
        <Row gap="sm" wrap>
          {trendingTags.map((item) => (
            <Pressable key={item.tag} style={styles.trendingChip} onPress={() => applyQuery(item.tag)}>
              <AppText variant="caption" color="textSecondary">{item.tag}</AppText>
            </Pressable>
          ))}
        </Row>
      )}
    </Stack>
  );

  const exploreIdle = (
    <Stack gap="lg" style={{ paddingHorizontal: gutter }}>
      {recentSearches.length > 0 ? (
        <Stack gap="md" style={styles.section}>
          <Row justify="between" align="center">
            <AppText variant="heading3">البحث الأخير</AppText>
            <Pressable onPress={() => saveRecent([])}>
              <AppText variant="caption" color="primary">مسح الكل</AppText>
            </Pressable>
          </Row>
          {recentSearches.map((term) => (
            <Pressable key={term} onPress={() => applyQuery(term)}>
              <Row gap="md" align="center" style={styles.recentRow}>
                <AppIcon name="time-outline" size={16} color={colors.textPrimary} />
                <AppText variant="body" color="textSecondary" style={styles.flex}>
                  {term}
                </AppText>
                <Pressable
                  onPress={() => saveRecent(recentSearches.filter((r) => r !== term))}
                  hitSlop={8}
                >
                  <AppIcon name="close" size={14} color={colors.textPrimary} />
                </Pressable>
              </Row>
            </Pressable>
          ))}
        </Stack>
      ) : null}

      {trendingBlock}

      {featuredUsers.length > 0 ? (
        <Stack gap="sm" style={styles.section}>
          <AppText variant="heading3">🏆 أبرز المربّين</AppText>
          {featuredUsers.map((user) => (
            <UserIdentityRow
              key={user.id}
              avatarUri={user.avatar}
              displayName={user.arabicName || user.displayName || user.username}
              username={user.username}
              verified={user.verified}
              avatarSize={USER_IDENTITY.listAvatarSize}
              avatarRadius={USER_IDENTITY.listAvatarRadius}
              avatarBorderWidth={USER_IDENTITY.listAvatarBorder}
              nameLines={2}
              onPress={() => router.push({ pathname: '/users/[id]', params: { id: user.id } } as never)}
              style={styles.userRow}
            />
          ))}
        </Stack>
      ) : null}
    </Stack>
  );

  const idleForSection =
    !isTab || section === 'explore'
      ? exploreIdle
      : section === 'trending'
        ? (
          <Stack gap="lg" style={{ paddingHorizontal: gutter }}>
            {trendingBlock}
          </Stack>
        )
        : (
          <Stack gap="sm" align="center" style={[styles.hintBox, { paddingHorizontal: gutter }]}>
            <AppText variant="caption" color="textMuted">
              {section === 'news' ? 'ابحث في الأخبار' : 'ابحث في الخدمات'}
            </AppText>
          </Stack>
        );

  return (
    <Screen edges={isTab ? [] : ['top', 'bottom']} keyboard>
      {isTab ? (
        <AppChromeLayer onHeight={setHeaderH}>
          <HomeAppBar
            displayName={displayName}
            avatarUri={me.avatar}
            onAvatarPress={openSidebar}
            center={searchField}
          >
            <Row style={styles.sectionRow}>
              {EXPLORE_SECTIONS.map((item) => {
                const active = section === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => selectSection(item.id)}
                    style={styles.sectionTab}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                  >
                    <AppText variant="body" color={active ? 'textPrimary' : 'textMuted'} numberOfLines={1}>
                      {item.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </Row>
          </HomeAppBar>
        </AppChromeLayer>
      ) : null}

      {isTab ? null : (
        <Row gap="sm" align="center" style={[styles.searchBar, { paddingHorizontal: gutter }]}>
          <SarhBackButton onPress={() => router.back()} color={colors.textPrimary} chrome="ghost" />
          {searchField}
        </Row>
      )}

      {hasQuery && query.trim().length >= MIN_QUERY && suggestions.length > 0 && !loading ? (
        <Stack
          gap="none"
          style={[
            styles.suggestBox,
            { marginHorizontal: gutter },
            isTab ? { marginTop: headerH } : null,
          ]}
        >
          {suggestions.map((s) => (
            <Pressable key={`${s.kind}-${s.text}`} onPress={() => applyQuery(s.text)}>
              <Row gap="sm" align="center" style={styles.suggestRow}>
                <AppIcon name="search" size={14} color={colors.textMuted} />
                <AppText variant="body" color="textSecondary" style={styles.flex}>
                  {s.text}
                </AppText>
              </Row>
            </Pressable>
          ))}
        </Stack>
      ) : null}

      {isTab || !hasQuery ? null : (
        <SarhChipRow contentPaddingHorizontal={gutter} style={styles.filterRowWrap}>
          {RESULT_SECTIONS.map((item) => {
            const active = filter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={[styles.resultTab, { minWidth: resultTabWidth }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <AppText variant="body" color={active ? 'textPrimary' : 'textMuted'} numberOfLines={1}>
                  {item.label}
                </AppText>
                {active ? <View style={styles.resultTabIndicator} /> : null}
              </Pressable>
            );
          })}
        </SarhChipRow>
      )}

      <ScreenBody
        padBottom={isTab ? 'md' : 'xxxl'}
        gutter={false}
        bottomInset={isTab ? 'tabBar' : 'none'}
        onScroll={isTab ? onChromeScroll : undefined}
        scrollEventThrottle={16}
        style={isTab && !(hasQuery && query.trim().length >= MIN_QUERY && suggestions.length > 0 && !loading)
          ? { paddingTop: headerH }
          : undefined}
      >
        {isTab || !hasQuery ? (
          idleForSection
        ) : (
          <Stack gap="lg" style={{ paddingHorizontal: gutter }}>
            {query.trim().length > 0 && query.trim().length < MIN_QUERY ? (
              <Stack gap="sm" align="center" style={styles.hintBox}>
                <AppText variant="caption" color="textMuted">
                  اكتب {MIN_QUERY} أحرف على الأقل للبحث
                </AppText>
              </Stack>
            ) : null}

            {loading && totalResults === 0 ? (
              <Stack gap="md" align="center" style={styles.loadingBox}>
                <ActivityIndicator color={colors.glow} />
                <AppText variant="caption" color="textMuted">جاري البحث...</AppText>
              </Stack>
            ) : null}

            {error && totalResults === 0 ? (
              <Stack gap="sm" align="center" style={styles.hintBox}>
                <AppText variant="body" color="danger" align="center">{error}</AppText>
                <AppText variant="caption" color="textMuted">تحقق من الاتصال وحاول مرة أخرى</AppText>
              </Stack>
            ) : null}

            {error && totalResults > 0 ? (
              <Stack gap="sm" align="center" style={styles.hintBox}>
                <AppText variant="caption" color="danger" align="center">{error}</AppText>
              </Stack>
            ) : null}

            {canSearch && filter === 'all' && latestItems.length > 0
              ? (
                <Stack gap="none" style={styles.section}>
                  {latestItems.map((item) => renderResult(item))}
                </Stack>
              )
              : null}

            {canSearch && filter !== 'all'
              ? visibleGroups.map((group) =>
                  group.items.length > 0 ? (
                    <Stack key={group.type} gap={group.type === 'listings' ? 'md' : 'none'} style={styles.section}>
                      {group.items.map((item) => renderResult(item))}
                    </Stack>
                  ) : null,
                )
              : null}

            {!loading && !error && canSearch && totalResults === 0 ? (
              <Stack gap="md" align="center" style={styles.noResults}>
                <AppText variant="display">🔍</AppText>
                <AppText variant="heading3" align="center">لم نجد نتائج مطابقة لبحثك</AppText>
                <AppText variant="body" color="textMuted" align="center">جرّب كلمة مختلفة أو عدّل الفلاتر</AppText>
              </Stack>
            ) : null}
          </Stack>
        )}
      </ScreenBody>
    </Screen>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const tokens = scheme === 'light' ? ds.light : ds.dark;
  return StyleSheet.create({
    searchBar: {
      paddingVertical: 12,
      backgroundColor: colors.screenRoot,
    },
    inputFlex: { flex: 1 },
    flex: { flex: 1 },
    sectionRow: {
      paddingTop: 12,
    },
    sectionTab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 32,
    },
    filterRowWrap: {
      backgroundColor: colors.screenRoot,
      paddingTop: 4,
    },
    resultTab: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 36,
      paddingBottom: 8,
      position: 'relative',
    },
    resultTabIndicator: {
      position: 'absolute',
      bottom: 0,
      width: 22,
      height: 2,
      borderRadius: 999,
      backgroundColor: colors.textPrimary,
    },
    suggestBox: {
      marginTop: 8,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
      overflow: 'hidden',
    },
    suggestRow: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    section: {
      padding: 16,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
    },
    recentRow: {
      minHeight: 52,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    trendingChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: ds.radius.pill,
      backgroundColor: tokens.primaryMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderMid,
    },
    userRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSoft,
    },
    resultRow: {
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSoft,
    },
    resultThumb: { width: 56, height: 56, borderRadius: ds.radius.md },
    resultThumbPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgDeep,
    },
    resultBody: { flex: 1, justifyContent: 'center' },
    loadingBox: { paddingVertical: 32 },
    hintBox: { paddingVertical: 24 },
    noResults: { paddingVertical: 60 },
  });
}
