// Powered by OnSpace.AI
// SAFAT — Home Tab (الصفاة)

import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState, useRef } from 'react';
import {
  InteractionManager,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ds } from '@/constants/designSystem';
import { spacing, typography } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { EditorialStoriesBar } from '@/components/feature/EditorialStoriesBar';
import { fetchEditorialStories, type EditorialStory } from '@/services/editorialStories';
import { ButcherMiniSection } from '@/components/feature/ButcherMiniSection';
import { ListingCard } from '@/components/feature/ListingCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PostItem } from '@/components/feature/PostItem';
import { HomeAppBar } from '@/components/ui/HomeAppBar';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { requireAuth, sharePost, showPostMenu } from '@/lib/postInteractions';
import { openPostDetail } from '@/lib/openPost';
import { compareListingBoostPriority, interleavePromotedListings } from '@/lib/listingSort';
import { fetchLiveStreamEligibility } from '@/lib/liveStreamAccess';
import { safePush } from '@/lib/safeNavigate';

const HOME_REFRESH_TTL_MS = 60_000;
const HOME_LISTINGS_LIMIT = 10;
const HOME_BUTCHERS_LIMIT = 10;
const HOME_POSTS_LIMIT = 10;
const TAB_BAR_CLEARANCE = ds.tabBar.height + ds.tabBar.fabLift + ds.space.xxl + 16;

export default function HomeScreen() {
  const router = useRouter();
  const styles = useThemedStyles(({ colors, sarh }) =>
    StyleSheet.create({
      root: sarh.screenRoot,
      container: sarh.screenRoot,
      scrollContent: {
        paddingBottom: spacing.lg,
      },
      listingsSection: {
        gap: 4,
      },
      postsSection: {
        // Keep tight under SectionHeader — same rhythm as listingsSection.
        marginTop: 0,
        gap: 4,
      },
      empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
      emptyIcon: { fontSize: 36 },
      emptyText: { ...typography.feedBody, color: colors.textMuted },
    }),
  );
  const {
    me,
    listings,
    posts,
    likedPosts,
    bookmarkedPosts,
    toggleLike,
    toggleBookmark,
    deletePost,
    fetchPosts,
    fetchListings,
  } = useApp();
  const { accessToken, isAuthenticated } = useAuth();
  const [editorialStories, setEditorialStories] = useState<EditorialStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [canShowLive, setCanShowLive] = useState(false);
  const lastStoriesAt = useRef(0);
  const lastLiveAt = useRef(0);
  const hasStoriesData = useRef(false);

  const refreshLiveAccess = useCallback(async (force = false) => {
    if (!accessToken || !isAuthenticated) {
      setCanShowLive(false);
      return;
    }
    const now = Date.now();
    if (!force && now - lastLiveAt.current < HOME_REFRESH_TTL_MS) return;
    lastLiveAt.current = now;
    const { canStream } = await fetchLiveStreamEligibility(accessToken);
    setCanShowLive(canStream);
  }, [accessToken, isAuthenticated]);

  const lastPostsFocusAt = useRef(Date.now());

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        void refreshLiveAccess();
      });
      return () => task.cancel();
    }, [refreshLiveAccess]),
  );

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastPostsFocusAt.current < HOME_REFRESH_TTL_MS) return;
      lastPostsFocusAt.current = now;
      void fetchPosts('for_you');
      void fetchListings();
    }, [fetchPosts, fetchListings]),
  );

  const fetchStories = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastStoriesAt.current < HOME_REFRESH_TTL_MS && hasStoriesData.current) {
      return;
    }
    setStoriesLoading(true);
    try {
      const data = await fetchEditorialStories();
      setEditorialStories(data);
      hasStoriesData.current = data.length > 0;
      lastStoriesAt.current = Date.now();
    } catch (err) {
      console.warn('[HomeScreen] Failed to fetch editorial stories:', err);
    } finally {
      setStoriesLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchStories();
    }, [fetchStories]),
  );

  const displayedListings = useMemo(() => {
    return interleavePromotedListings(listings.slice().sort(compareListingBoostPriority)).slice(
      0,
      HOME_LISTINGS_LIMIT,
    );
  }, [listings]);

  const recentPosts = useMemo(() => {
    return posts
      .slice()
      .sort((a, b) => {
        const ta = new Date(a.createdAt ?? 0).getTime();
        const tb = new Date(b.createdAt ?? 0).getTime();
        return tb - ta;
      })
      .slice(0, HOME_POSTS_LIMIT);
  }, [posts]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <HomeAppBar
          onMenu={() => safePush('/sidebar', undefined, router)}
          onSearch={() => safePush('/search', undefined, router)}
          onLive={() => safePush('/(tabs)/live', undefined, router)}
          showLive={canShowLive}
        />

        <AppScrollView contentContainerStyle={styles.scrollContent}>
          <EditorialStoriesBar stories={editorialStories} loading={storiesLoading} />

          {/* 1) ستوريات الأخبار → 2) الملاحم → 3) الإعلانات → 4) المنشورات */}
          <ButcherMiniSection size="grid" showStories={false} limit={HOME_BUTCHERS_LIMIT} />

          <SectionHeader
            title="الإعلانات"
            onSeeAll={() => safePush('/(tabs)/market', undefined, router)}
          />
          <View style={styles.listingsSection}>
            {displayedListings.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyText}>لا توجد إعلانات بعد</Text>
              </View>
            ) : (
              displayedListings.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  variant="list"
                  listMode="market"
                  onPress={() =>
                    safePush({ pathname: '/listing/[id]', params: { id: item.id } }, undefined, router)
                  }
                />
              ))
            )}
          </View>

          <SectionHeader
            title="المنشورات"
            onSeeAll={() => safePush('/(tabs)/posts', undefined, router)}
          />
          <View style={styles.postsSection}>
            {recentPosts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyText}>لا توجد منشورات بعد</Text>
              </View>
            ) : (
              recentPosts.map((item) => (
                <PostItem
                  key={item.id}
                  post={{
                    ...item,
                    liked: likedPosts.has(item.id),
                    bookmarked: bookmarkedPosts.has(item.id),
                  }}
                  onPress={() => openPostDetail(router, item.id)}
                  onLike={() => requireAuth(isAuthenticated, 'الإعجاب') && toggleLike(item.id)}
                  onComment={() => openPostDetail(router, item.id, { focusComment: isAuthenticated })}
                  onBookmark={() =>
                    requireAuth(isAuthenticated, 'الحفظ') && toggleBookmark(item.id)
                  }
                  onShare={() => sharePost(item)}
                  onMenu={() => showPostMenu(item, me, router, deletePost, isAuthenticated)}
                />
              ))
            )}
          </View>

          <View style={{ height: TAB_BAR_CLEARANCE }} />
        </AppScrollView>
      </SafeAreaView>
    </View>
  );
}
