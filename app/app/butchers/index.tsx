// Powered by OnSpace.AI
// SAFAT — Butchers Listing Screen (قسم الملاحم)
import { AppIcon } from '@/components/ui/FlaticonIcon';

import { Image } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { countries } from '@/services/types';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import {
  ButcherProfile,
  ButcherStory,
  Country,
  BUTCHER_RANKING_TABS,
  type ButcherRankingCategory,
  mapButcherFromApi,
} from '@/services/butcherData';
import { ButcherCard } from '@/components/feature/ButcherCard';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { getRtlText, getRtlRow } from '@/lib/rtl';

const STORY_CIRCLE = 62;

const RANKING_FILTER_ICONS: Record<ButcherRankingCategory, { icon: string; emoji: string }> = {
  rating: { icon: 'star', emoji: '⭐' },
  favorites: { icon: 'heart', emoji: '❤️' },
  orders: { icon: 'flame', emoji: '🔥' },
  distance: { icon: 'navigate-outline', emoji: '📍' },
  new: { icon: 'sparkles-outline', emoji: '🆕' },
};

// ─── Story Type Colors ────────────────────────────────────────────────────────
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

// ─── Components ───────────────────────────────────────────────────────────────

function StoriesRow({ stories, onStoryPress }: {
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

const GCC_COUNTRIES: { code: Country; label: string; flag: string }[] = [
  { code: 'SA', label: 'السعودية', flag: '🇸🇦' },
];

export default function ButchersScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(({ colors }) => createScreenStyles(colors));
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuth();
  const [butchersList, setButchersList] = useState<ButcherProfile[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rankingTab, setRankingTab] = useState<ButcherRankingCategory>('rating');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [seenStories, setSeenStories] = useState<Set<string>>(new Set());
  const [butcherStories, setButcherStories] = useState<ButcherStory[]>([]);
  const [showCountryFilter, setShowCountryFilter] = useState(false);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const res = await fetch(`${API_BASE}/api/butchers/stories`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const mapped = json.data.map((s: any) => ({
              id: s.id,
              butcherId: s.butcherId,
              butcherName: s.butcher?.nameAr || s.butcher?.nameEn || 'ملحمة',
              butcherNameAr: s.butcher?.nameAr || 'ملحمة',
              butcherLogo: s.butcher?.logo || undefined,
              isVerified: s.butcher?.subscriptionActive || false,
              thumbnail: s.thumbnail,
              caption: s.caption,
              captionAr: s.captionAr,
              postedAt: s.createdAt,
              duration: s.duration || 15,
              seen: false,
              type: s.type,
            }));
            setButcherStories(mapped);
          }
        }
      } catch (err) {
        console.warn('[ButchersScreen] Failed to fetch stories:', err);
      }
    };
    fetchStories();
  }, [accessToken]);

  useEffect(() => {
    if (rankingTab !== 'distance') return;
    void (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({});
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        // Location unavailable — distance tab falls back to server rank order.
      }
    })();
  }, [rankingTab]);

  useEffect(() => {
    const fetchButchers = async () => {
      try {
        const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const params = new URLSearchParams({ sort: rankingTab });
        if (rankingTab === 'distance' && userCoords) {
          params.set('lat', String(userCoords.lat));
          params.set('lng', String(userCoords.lng));
        }
        const res = await fetch(`${API_BASE}/api/butchers?${params.toString()}`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.butchers) {
            const mapped = json.data.butchers
              .filter((b: any) => (b.country || 'SA') !== 'EG')
              .map((b: any) => mapButcherFromApi(b));
            setButchersList(mapped);
          }
        }
      } catch (err) {
        console.warn('[ButchersScreen] Failed to fetch butchers:', err);
      }
    };
    fetchButchers();
  }, [accessToken, rankingTab, userCoords]);

  const filtered = butchersList.filter((b) => {
    if (selectedCountry !== 'all' && b.country !== selectedCountry) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.nameAr.includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.cityAr.includes(q) ||
        b.specialties.some((sp) => sp.includes(q))
      );
    }
    return true;
  });

  const activeTabLabel =
    BUTCHER_RANKING_TABS.find((t) => t.id === rankingTab)?.label ?? 'الملاحم';

  const storiesWithSeen = butcherStories.map((s) => ({
    ...s,
    seen: seenStories.has(s.id),
  }));

  const handleStoryPress = (story: ButcherStory) => {
    setSeenStories((prev) => new Set([...prev, story.id]));
    router.push({
      pathname: '/butchers/story-viewer',
      params: { butcherId: story.butcherId, storyId: story.id },
    });
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Premium Header ── */}
        <View style={s.stickyHeader}>
          <View style={[s.headerRow, getRtlRow()]}>
            <View style={[s.headerActions, getRtlRow()]}>
              <Pressable style={s.iconBtn} onPress={() => router.push('/butchers-market-sidebar')} hitSlop={8}>
                <AppIcon name="menu" size={22} color={colors.textPrimary} />
              </Pressable>
              <NotificationBellButton size={40} iconSize={20} style={s.iconBtn} />
            </View>

            <View style={s.headerTextBlock}>
              <Text style={s.headerTitle}>الملاحم</Text>
              <Text style={s.headerSub}>ابحث عن أفضل الملاحم القريبة منك</Text>
            </View>

            <LinearGradient
              colors={[colors.electric + '55', colors.electric + '18']}
              style={s.headerIconBox}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={s.headerIconInner}>
                <Text style={s.headerIconEmoji}>🥩</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Search */}
          <View style={[s.searchWrap, getRtlRow()]}>
            <Pressable
              style={s.filterInlineBtn}
              onPress={() => setShowCountryFilter((v) => !v)}
              hitSlop={8}
            >
              <AppIcon
                name="options-outline"
                size={18}
                color={showCountryFilter ? colors.electricBright : colors.textMuted}
              />
            </Pressable>
            <TextInput
              style={s.searchInput}
              placeholder="ابحث عن ملحمة، مدينة، أو نوع لحم..."
              placeholderTextColor={colors.textSubtle}
              value={searchQuery}
              onChangeText={setSearchQuery}
              textAlign="right"
            />
            <AppIcon name="search-outline" size={20} color={colors.textMuted} />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <AppIcon name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {showCountryFilter ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.countryRow}
            >
              <Pressable
                onPress={() => setSelectedCountry('all')}
                style={[s.countryChip, selectedCountry === 'all' && s.countryChipActive]}
              >
                <Text style={s.countryChipFlag}>🌍</Text>
                <Text style={[s.countryChipLabel, selectedCountry === 'all' && s.countryChipLabelActive]}>
                  الكل
                </Text>
              </Pressable>
              {GCC_COUNTRIES.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => setSelectedCountry(c.code)}
                  style={[s.countryChip, selectedCountry === c.code && s.countryChipActive]}
                >
                  <Text style={s.countryChipFlag}>{c.flag}</Text>
                  <Text style={[s.countryChipLabel, selectedCountry === c.code && s.countryChipLabelActive]}>
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {/* Quick filter cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.quickFiltersRow}
          >
            {BUTCHER_RANKING_TABS.map((tab) => {
              const active = rankingTab === tab.id;
              const meta = RANKING_FILTER_ICONS[tab.id];
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setRankingTab(tab.id)}
                  style={[s.quickFilterCard, active && s.quickFilterCardActive]}
                >
                  <Text style={s.quickFilterEmoji}>{meta.emoji}</Text>
                  <Text style={[s.quickFilterLabel, active && s.quickFilterLabelActive]}>
                    {tab.label}
                  </Text>
                  {active ? <View style={s.quickFilterIndicator} /> : null}
                </Pressable>
              );
            })}
            <Pressable
              style={s.showAllBtn}
              onPress={() => {
                setRankingTab('rating');
                setSelectedCountry('all');
                setSearchQuery('');
              }}
            >
              <Text style={s.showAllText}>عرض الكل</Text>
            </Pressable>
          </ScrollView>

          <View style={[s.headerMetaRow, getRtlRow()]}>
            <Pressable style={s.mapLinkBtn} onPress={() => router.push('/butchers/map')}>
              <AppIcon name="map-outline" size={16} color={colors.electricBright} />
              <Text style={s.mapLinkText}>الخريطة</Text>
            </Pressable>
            <Text style={s.resultsCount}>{filtered.length} ملحمة</Text>
          </View>
        </View>

        {/* ── Stories ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>قصص اليوم</Text>
            <View style={s.liveDotRow}>
              <View style={s.liveDot} />
              <Text style={s.sectionSub}>{storiesWithSeen.filter((s) => !s.seen).length} جديد</Text>
            </View>
          </View>
          <StoriesRow stories={storiesWithSeen} onStoryPress={handleStoryPress} />
        </View>

        {/* ── Listing ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{activeTabLabel} ({filtered.length})</Text>
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

          {filtered.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>🥩</Text>
              <Text style={s.emptyTitle}>لا توجد ملاحم</Text>
              <Text style={s.emptySub}>جرّب تغيير الفلتر أو البلد</Text>
            </View>
          ) : (
            filtered.map((butcher) => (
              <ButcherCard
                key={butcher.id}
                butcher={butcher}
                onPress={() =>
                  router.push({
                    pathname: '/butchers/[id]',
                    params: { id: butcher.id },
                  })
                }
                onOrder={() =>
                  router.push({
                    pathname: '/butchers/order',
                    params: { butcherId: butcher.id },
                  })
                }
              />
            ))
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function createScreenStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenRoot },
  scroll: { paddingBottom: 20 },

  // Sticky header
  stickyHeader: {
    paddingBottom: spacing.sm,
    backgroundColor: colors.screenRoot,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  headerTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    ...typography.h1,
    fontSize: 26,
    fontWeight: '600',
    color: colors.textPrimary,
    ...getRtlText(),
    ...getRtlText(),
  },
  headerSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    ...getRtlText(),
    ...getRtlText(),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgGlass,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    padding: 1.5,
    borderWidth: 1,
    borderColor: colors.electric + '66',
  },
  headerIconInner: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconEmoji: { fontSize: 24 },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 52,
  },
  filterInlineBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    ...getRtlText(),
    ...getRtlText(),
  },

  quickFiltersRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  quickFilterCard: {
    minWidth: 88,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  quickFilterCardActive: {
    backgroundColor: colors.electric + '14',
    borderColor: colors.electric,
    shadowColor: colors.electric,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  quickFilterEmoji: { fontSize: 18 },
  quickFilterLabel: {
    ...typography.micro,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  quickFilterLabelActive: {
    color: colors.electricBright,
    fontWeight: '600',
  },
  quickFilterIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.electric,
  },
  showAllBtn: {
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMid,
    backgroundColor: colors.bgGlass,
    alignSelf: 'center',
  },
  showAllText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    writingDirection: 'rtl', textAlign: 'right' as const,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  mapLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.electric + '12',
    borderWidth: 1,
    borderColor: colors.electric + '33',
  },
  mapLinkText: {
    ...typography.micro,
    fontWeight: '600',
    color: colors.electricBright,
    writingDirection: 'rtl', textAlign: 'right' as const,
  },
  resultsCount: {
    ...typography.caption,
    color: colors.textMuted,
    writingDirection: 'rtl', textAlign: 'right' as const,
  },

  // Country chips
  countryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  countryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  countryChipActive: {
    backgroundColor: colors.electric,
    borderColor: colors.electric,
  },
  countryChipFlag: { fontSize: 14 },
  countryChipLabel: { ...typography.caption, color: colors.textMuted },
  countryChipLabelActive: { color: '#fff', fontWeight: '600' },

  // Sections
  section: { marginTop: spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  sectionSub: { ...typography.caption, color: colors.textMuted },
  liveDotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.electricBright + '66',
    backgroundColor: colors.electric + '11',
  },
  addBtnText: { ...typography.micro, color: colors.textBrandStrong },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: spacing.sm,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary },
  emptySub: { ...typography.caption, color: colors.textMuted },
  });
}

// Stories
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
