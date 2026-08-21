// SAFAT — Unified Search Screen (البحث)
import { Image, uriSource } from '@/components/ui/AppImage';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { UserIdentityRow, USER_IDENTITY } from '@/components/ui/UserIdentityRow';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ds } from '@/constants/designSystem';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlText, marginAutoStart, rtlBackIcon, getRtlRow } from '@/lib/rtl';
import { ListingCard } from '@/components/feature/ListingCard';
import { FilterChip, FilterChipRow } from '@/components/ui/FilterChip';
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

const RECENT_KEY = 'safat_recent_searches';
const MIN_QUERY = 2;

type SearchFilter = SearchContentType;

const FILTERS: { id: SearchFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'listings', label: 'الإعلانات' },
  { id: 'posts', label: 'المنشورات' },
  { id: 'butchers', label: 'الملاحم' },
  { id: 'news', label: 'الأخبار' },
  { id: 'services', label: 'الخدمات' },
];

const GROUP_LABELS: Record<Exclude<SearchFilter, 'all'>, string> = {
  listings: 'الإعلانات',
  posts: 'المنشورات',
  butchers: 'الملاحم',
  news: 'الأخبار',
  services: 'الخدمات',
  users: 'الحسابات',
};

export default function SearchScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, scheme }) => createStyles(colors, scheme));
  const router = useRouter();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 350);
  const [filter, setFilter] = useState<SearchFilter>('all');
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
    if (debouncedQuery.length < MIN_QUERY) return;

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
        setGroups([]);
        setError(err instanceof Error ? err.message : 'تعذّر إكمال البحث');
      })
      .finally(() => {
        if (seq === searchSeq.current) setLoading(false);
      });
  }, [debouncedQuery, filter]);

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

  const applyQuery = useCallback(
    (term: string) => {
      setQuery(term);
      addRecentSearch(term);
    },
    [addRecentSearch],
  );

  const hasQuery = query.trim().length > 0;
  const canSearch = debouncedQuery.length >= MIN_QUERY;

  const visibleGroups = useMemo(() => {
    if (filter === 'all') return groups;
    return groups.filter((g) => g.type === filter);
  }, [groups, filter]);

  const totalResults = useMemo(
    () => visibleGroups.reduce((n, g) => n + g.items.length, 0),
    [visibleGroups],
  );

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
            {item.imageUrl ? (
              <Image source={uriSource(item.imageUrl)} style={styles.resultThumb} contentFit="cover" />
            ) : (
              <View style={[styles.resultThumb, styles.resultThumbPlaceholder]}>
                <AppIcon name="store" size={20} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.resultBody}>
              <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
              {item.subtitle ? (
                <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      case 'news':
        return (
          <Pressable
            key={`news-${item.id}`}
            style={styles.resultRow}
            onPress={() => router.push('/news' as never)}
          >
            {item.imageUrl ? (
              <Image source={uriSource(item.imageUrl)} style={styles.resultThumb} contentFit="cover" />
            ) : null}
            <View style={styles.resultBody}>
              <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
              {item.subtitle ? (
                <Text style={styles.resultSubtitle} numberOfLines={2}>{item.subtitle}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      case 'services':
        return (
          <Pressable
            key={`service-${item.id}`}
            style={styles.resultRow}
            onPress={() => router.push('/sarh-services' as never)}
          >
            <View style={[styles.resultThumb, styles.resultThumbPlaceholder]}>
              <AppIcon name="briefcase" size={20} color={colors.textMuted} />
            </View>
            <View style={styles.resultBody}>
              <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
              {item.subtitle ? (
                <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      case 'posts':
        return (
          <Pressable
            key={`post-${item.id}`}
            style={styles.resultRow}
            onPress={() => router.push({ pathname: '/posts/[id]', params: { id: item.id } } as never)}
          >
            {item.imageUrl ? (
              <Image source={uriSource(item.imageUrl)} style={styles.resultThumb} contentFit="cover" />
            ) : (
              <View style={[styles.resultThumb, styles.resultThumbPlaceholder]}>
                <AppIcon name="file-text" size={20} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.resultBody}>
              <Text style={styles.resultTitle} numberOfLines={3}>{item.title}</Text>
              {item.subtitle ? (
                <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.inputWrap}>
          <AppIcon name="search" size={16} color={colors.textPrimary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث في سرح..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            returnKeyType="search"
            textAlign="right"
            onSubmitEditing={() => addRecentSearch(query)}
          />
          {hasQuery ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <AppIcon name="close-circle" size={16} color={colors.textPrimary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {hasQuery && query.trim().length >= MIN_QUERY && suggestions.length > 0 && !loading ? (
        <View style={styles.suggestBox}>
          {suggestions.map((s) => (
            <Pressable key={`${s.kind}-${s.text}`} style={styles.suggestRow} onPress={() => applyQuery(s.text)}>
              <AppIcon name="search" size={14} color={colors.textMuted} />
              <Text style={styles.suggestText}>{s.text}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {hasQuery ? (
        <FilterChipRow contentPaddingHorizontal={spacing.lg} style={styles.filterRowWrap}>
          {FILTERS.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              selected={filter === f.id}
              onPress={() => setFilter(f.id)}
            />
          ))}
        </FilterChipRow>
      ) : null}

      {!hasQuery ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {recentSearches.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>البحث الأخير</Text>
                <Pressable onPress={() => saveRecent([])}>
                  <Text style={styles.clearText}>مسح الكل</Text>
                </Pressable>
              </View>
              {recentSearches.map((term) => (
                <Pressable key={term} style={styles.recentRow} onPress={() => applyQuery(term)}>
                  <AppIcon name="time-outline" size={16} color={colors.textPrimary} />
                  <Text style={styles.recentText}>{term}</Text>
                  <Pressable
                    onPress={() => saveRecent(recentSearches.filter((r) => r !== term))}
                    hitSlop={8}
                    style={marginAutoStart()}
                  >
                    <AppIcon name="close" size={14} color={colors.textPrimary} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 الأكثر تداولاً</Text>
            {trendingTags.length === 0 ? (
              <Text style={styles.mutedCaption}>لا توجد هاشتاقات رائجة حالياً</Text>
            ) : (
              <View style={styles.trendingGrid}>
                {trendingTags.map((item) => (
                  <Pressable key={item.tag} style={styles.trendingChip} onPress={() => applyQuery(item.tag)}>
                    <Text style={styles.trendingText}>{item.tag}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {featuredUsers.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏆 أبرز المربّين</Text>
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
            </View>
          ) : null}
          <View style={{ height: 80 }} />
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {query.trim().length > 0 && query.trim().length < MIN_QUERY ? (
            <View style={styles.hintBox}>
              <Text style={styles.mutedCaption}>اكتب {MIN_QUERY} أحرف على الأقل للبحث</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.glow} />
              <Text style={styles.mutedCaption}>جاري البحث...</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.hintBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.mutedCaption}>تحقق من الاتصال وحاول مرة أخرى</Text>
            </View>
          ) : null}

          {!loading && !error && canSearch
            ? visibleGroups.map((group) =>
                group.items.length > 0 ? (
                  <View key={group.type} style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      {GROUP_LABELS[group.type]} ({group.items.length})
                    </Text>
                    <View style={group.type === 'listings' ? styles.listingsFeed : undefined}>
                      {group.items.map((item) => renderResult(item))}
                    </View>
                  </View>
                ) : null,
              )
            : null}

          {!loading && !error && canSearch && totalResults === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsIcon}>🔍</Text>
              <Text style={styles.noResultsText}>لم نجد نتائج مطابقة لبحثك</Text>
              <Text style={styles.noResultsSub}>جرّب كلمة مختلفة أو عدّل الفلاتر</Text>
            </View>
          ) : null}

          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const tokens = scheme === 'light' ? ds.light : ds.dark;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgDeep,
    },
    backBtn: {
      width: ds.iconBtn.md,
      height: ds.iconBtn.md,
      borderRadius: 12,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 44,
      backgroundColor: colors.bgElevated,
      borderRadius: 14,
      paddingHorizontal: spacing.md,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    },
    filterRowWrap: {
      backgroundColor: colors.bgDeep,
      paddingVertical: spacing.sm,
    },
    suggestBox: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
      overflow: 'hidden',
    },
    suggestRow: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    suggestText: { ...typography.body, color: colors.textSecondary, flex: 1, textAlign: 'right' },
    scroll: { paddingBottom: 20 },
    section: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      padding: spacing.lg,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    clearText: { ...typography.caption, color: colors.textBrandStrong },
    recentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 52,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    recentText: { ...typography.body, color: colors.textSecondary, flex: 1, textAlign: 'right' },
    trendingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    trendingChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
      borderRadius: ds.radius.pill,
      backgroundColor: tokens.primaryMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderMid,
    },
    trendingText: { ...typography.caption, color: colors.textSecondary },
    userRow: {
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSoft,
    },
    listingsFeed: { gap: spacing.md },
    resultRow: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSoft,
    },
    resultThumb: { width: 56, height: 56, borderRadius: ds.radius.md },
    resultThumbPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgDeep,
    },
    resultBody: { flex: 1, gap: 4, justifyContent: 'center' },
    resultTitle: { ...typography.body, color: colors.textPrimary, ...getRtlText() },
    resultSubtitle: { ...typography.caption, color: colors.textMuted, ...getRtlText() },
    loadingBox: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
    hintBox: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.sm },
    mutedCaption: { ...typography.caption, color: colors.textMuted, textAlign: 'right' },
    errorText: { ...typography.body, color: colors.danger, textAlign: 'center' },
    noResults: { alignItems: 'center', paddingVertical: 60, gap: spacing.md },
    noResultsIcon: { fontSize: 48 },
    noResultsText: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
    noResultsSub: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  });
}
