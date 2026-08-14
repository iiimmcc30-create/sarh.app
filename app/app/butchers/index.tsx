// Powered by OnSpace.AI
// SAFAT — Butchers Listing Screen (قسم الملاحم)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import {
  ButcherProfile,
  ButcherStory,
  BUTCHER_RANKING_TABS,
  type ButcherRankingCategory,
  mapButcherFromApi,
} from '@/services/butcherData';
import { ButcherDeliveryCard } from '@/components/feature/ButcherDeliveryCard';
import { ButchersAppBar } from '@/components/butchers/ButchersAppBar';
import { ButcherLocationBar } from '@/components/butchers/ButcherLocationBar';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getRtlText } from '@/lib/rtl';

const STORY_CIRCLE = 62;
const SECTION_LIMIT = 12;

const STORY_TYPE_COLORS = {
  daily_slaughter: ['#EF4444', '#DC2626'],
  offer: ['#F59E0B', '#D97706'],
  new_stock: ['#20B66F', '#18965B'],
  update: ['#3B82F6', '#2563EB'],
} as const;

const STORY_TYPE_ICONS = {
  daily_slaughter: '🔪',
  offer: '🏷️',
  new_stock: '📦',
  update: '📢',
};

const EMPTY_SECTIONS = (): Record<ButcherRankingCategory, ButcherProfile[]> => ({
  rank: [],
  rating: [],
  favorites: [],
  orders: [],
  distance: [],
  new: [],
});

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

function StoriesRow({
  stories,
  onStoryPress,
}: {
  stories: ButcherStory[];
  onStoryPress: (story: ButcherStory) => void;
}) {
  const { colors } = useTheme();
  const st = useThemedStyles(({ colors }) => createStoryStyles(colors));
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={st.storiesContent}
    >
      {stories.map((story) => {
        const typeColors = STORY_TYPE_COLORS[story.type];
        return (
          <Pressable key={story.id} onPress={() => onStoryPress(story)} style={st.storyItem}>
            <LinearGradient
              colors={story.seen ? [colors.borderSoft, colors.borderSoft] : typeColors}
              style={st.storyRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={st.storyInner}>
                <Image
                  source={{ uri: story.butcherLogo }}
                  style={st.storyAvatar}
                  contentFit="cover"
                />
                {story.isVerified && (
                  <View style={st.storyVerifiedDot}>
                    <AppIcon name="shield-checkmark" size={9} color={colors.electricBright} />
                  </View>
                )}
              </View>
            </LinearGradient>
            <View style={st.storyTypeChip}>
              <Text style={st.storyTypeIcon}>{STORY_TYPE_ICONS[story.type]}</Text>
            </View>
            <Text style={st.storyName} numberOfLines={1}>
              {story.butcherNameAr.split(' ').slice(0, 2).join(' ')}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function ButcherCategoryRow({
  butchers,
  cardWidth,
  cardGap,
  loading,
  onPressButcher,
}: {
  butchers: ButcherProfile[];
  cardWidth: number;
  cardGap: number;
  loading: boolean;
  onPressButcher: (id: string) => void;
}) {
  const { colors } = useTheme();
  const s = useThemedStyles(({ colors }) => createScreenStyles(colors));

  if (loading && butchers.length === 0) {
    return (
      <View style={[s.rowSkeleton, { width: cardWidth, marginHorizontal: spacing.lg }]}>
        <ActivityIndicator color={colors.electricBright} />
      </View>
    );
  }

  if (butchers.length === 0) {
    return (
      <View style={[s.rowEmpty, { marginHorizontal: spacing.lg }]}>
        <Text style={s.rowEmptyText}>لا توجد ملاحم في هذا التصنيف</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[s.categoryRow, { gap: cardGap }]}
      decelerationRate="fast"
      snapToInterval={cardWidth + cardGap}
      snapToAlignment="start"
    >
      {butchers.map((butcher) => (
        <ButcherDeliveryCard
          key={butcher.id}
          butcher={butcher}
          width={cardWidth}
          onPress={() => onPressButcher(butcher.id)}
        />
      ))}
    </ScrollView>
  );
}

export default function ButchersScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(({ colors }) => createScreenStyles(colors));
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { accessToken, isAuthenticated } = useAuth();
  const [sections, setSections] = useState(EMPTY_SECTIONS);
  const [loadingSections, setLoadingSections] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [seenStories, setSeenStories] = useState<Set<string>>(new Set());
  const [butcherStories, setButcherStories] = useState<ButcherStory[]>([]);

  const cardGap = spacing.md;
  const cardPad = spacing.lg;
  const cardWidth = Math.round((screenWidth - cardPad - cardGap) / 1.5);

  const fetchButchersForSort = useCallback(
    async (sort: ButcherRankingCategory): Promise<ButcherProfile[]> => {
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
        // Distance section falls back to server order without coords.
      }
    })();
  }, []);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const res = await fetch(`${API_BASE}/api/butchers/stories`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const mapped = json.data.map((story: Record<string, unknown>) => ({
              id: String(story.id),
              butcherId: String(story.butcherId),
              butcherName: (story.butcher as { nameAr?: string; nameEn?: string })?.nameAr ||
                (story.butcher as { nameEn?: string })?.nameEn ||
                'ملحمة',
              butcherNameAr: (story.butcher as { nameAr?: string })?.nameAr || 'ملحمة',
              butcherLogo: (story.butcher as { logo?: string })?.logo || undefined,
              isVerified: Boolean((story.butcher as { subscriptionActive?: boolean })?.subscriptionActive),
              thumbnail: story.thumbnail as string,
              caption: story.caption as string,
              captionAr: story.captionAr as string,
              postedAt: String(story.createdAt),
              duration: Number(story.duration) || 15,
              seen: false,
              type: story.type as ButcherStory['type'],
            }));
            setButcherStories(mapped);
          }
        }
      } catch (err) {
        console.warn('[ButchersScreen] Failed to fetch stories:', err);
      }
    };
    void fetchStories();
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingSections(true);
      try {
        const tabs = BUTCHER_RANKING_TABS.map((tab) => tab.id);
        const results = await Promise.all(tabs.map((sort) => fetchButchersForSort(sort)));
        if (cancelled) return;
        const next = EMPTY_SECTIONS();
        tabs.forEach((sort, index) => {
          next[sort] = results[index] ?? [];
        });
        setSections(next);
      } catch (err) {
        console.warn('[ButchersScreen] Failed to fetch butchers:', err);
      } finally {
        if (!cancelled) setLoadingSections(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchButchersForSort]);

  const filteredSections = useMemo(() => {
    const next = EMPTY_SECTIONS();
    for (const tab of BUTCHER_RANKING_TABS) {
      next[tab.id] = filterButchers(sections[tab.id], searchQuery);
    }
    return next;
  }, [sections, searchQuery]);

  const storiesWithSeen = butcherStories.map((story) => ({
    ...story,
    seen: seenStories.has(story.id),
  }));

  const handleStoryPress = (story: ButcherStory) => {
    setSeenStories((prev) => new Set([...prev, story.id]));
    router.push({
      pathname: '/butchers/story-viewer',
      params: { butcherId: story.butcherId, storyId: story.id },
    });
  };

  const openButcher = (id: string) => {
    router.push({ pathname: '/butchers/[id]', params: { id } });
  };

  const hasAnyResults = BUTCHER_RANKING_TABS.some((tab) => filteredSections[tab.id].length > 0);

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
            onMenu={() => router.push('/butchers-market-sidebar')}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </View>

        {storiesWithSeen.length > 0 ? (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>قصص اليوم</Text>
              <View style={s.liveDotRow}>
                <View style={s.liveDot} />
                <Text style={s.sectionSub}>
                  {storiesWithSeen.filter((story) => !story.seen).length} جديد
                </Text>
              </View>
            </View>
            <StoriesRow stories={storiesWithSeen} onStoryPress={handleStoryPress} />
          </View>
        ) : null}

        {!loadingSections && searchQuery.trim() && !hasAnyResults ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🔍</Text>
            <Text style={s.emptyTitle}>لا توجد نتائج</Text>
            <Text style={s.emptySub}>جرّب كلمة بحث أخرى</Text>
          </View>
        ) : (
          BUTCHER_RANKING_TABS.map((tab) => {
            const items = filteredSections[tab.id];
            if (!loadingSections && searchQuery.trim() && items.length === 0) return null;
            return (
              <View key={tab.id} style={s.categorySection}>
                <SectionHeader
                  title={tab.label}
                  onSeeAll={items.length > 0 ? () => router.push('/butchers/map') : undefined}
                />
                <ButcherCategoryRow
                  butchers={items}
                  cardWidth={cardWidth}
                  cardGap={cardGap}
                  loading={loadingSections}
                  onPressButcher={openButcher}
                />
              </View>
            );
          })
        )}

        <View style={s.footerActions}>
          <Pressable style={s.mapLinkBtn} onPress={() => router.push('/butchers/map')}>
            <AppIcon name="map-outline" size={16} color={colors.electricBright} />
            <Text style={s.mapLinkText}>عرض على الخريطة</Text>
          </Pressable>
          <Pressable
            style={s.addBtn}
            onPress={() => {
              if (!isAuthenticated) {
                router.push('/auth/phone');
                return;
              }
              router.push('/butchers/apply');
            }}
          >
            <AppIcon name="add" size={14} color={colors.electricBright} />
            <Text style={s.addBtnText}>سجّل ملحمتك</Text>
          </Pressable>
        </View>

        <View style={{ height: spacing.xl }} />
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
    stickyHeader: {
      backgroundColor: colors.bgElevated,
    },

    section: { marginTop: spacing.lg },
    categorySection: {
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, ...getRtlText() },
    sectionSub: { ...typography.caption, color: colors.textMuted },
    liveDotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.success,
    },

    categoryRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    rowSkeleton: {
      height: 220,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowEmpty: {
      minHeight: 72,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    rowEmptyText: {
      ...typography.caption,
      color: colors.textMuted,
      ...getRtlText(),
    },

    footerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      gap: spacing.md,
    },
    mapLinkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: colors.electric + '12',
    },
    mapLinkText: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.electricBright,
      writingDirection: 'rtl',
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.electricBright + '66',
      backgroundColor: colors.electric + '11',
    },
    addBtnText: { ...typography.micro, color: colors.textBrandStrong },

    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
      gap: spacing.sm,
    },
    emptyIcon: { fontSize: 48 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, ...getRtlText() },
    emptySub: { ...typography.caption, color: colors.textMuted, ...getRtlText() },
  });
}

function createStoryStyles(colors: ThemeColors) {
  return StyleSheet.create({
    storiesContent: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    storyItem: {
      alignItems: 'center',
      gap: 4,
      width: STORY_CIRCLE + 8,
      position: 'relative',
    },
    storyRing: {
      width: STORY_CIRCLE + 4,
      height: STORY_CIRCLE + 4,
      borderRadius: (STORY_CIRCLE + 4) / 2,
      padding: 2.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storyInner: {
      width: STORY_CIRCLE,
      height: STORY_CIRCLE,
      borderRadius: STORY_CIRCLE / 2,
      borderWidth: 2,
      borderColor: colors.bgDeep,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: colors.bgSurface,
    },
    storyAvatar: {
      width: '100%',
      height: '100%',
    },
    storyVerifiedDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.bgDeep,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.electricBright + '55',
    },
    storyTypeChip: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 22,
      height: 22,
      borderRadius: 12,
      backgroundColor: colors.bgElevated,
      borderWidth: 1.5,
      borderColor: colors.bgDeep,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storyTypeIcon: { fontSize: 10 },
    storyName: {
      ...typography.micro,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: STORY_CIRCLE + 8,
    },
  });
}
