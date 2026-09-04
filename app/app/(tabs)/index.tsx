// Powered by OnSpace.AI
// SAFAT — Home Tab (الصفاة)

import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ds } from '@/constants/designSystem';
import { spacing, typography } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { EditorialStoriesBar } from '@/components/feature/EditorialStoriesBar';
import { ExploreSarhSection } from '@/components/feature/ExploreSarhSection';
import { fetchEditorialStories, type EditorialStory } from '@/services/editorialStories';
import { fetchHomeExploreSections } from '@/services/homeExplore';
import { FALLBACK_HOME_EXPLORE, type HomeExploreCard } from '@/lib/homeExplore';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PostItem } from '@/components/feature/PostItem';
import { HomeAppBar } from '@/components/ui/HomeAppBar';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { requireAuth, sharePost, showPostMenu } from '@/lib/postInteractions';
import { openPostDetail } from '@/lib/openPost';
import { safePush } from '@/lib/safeNavigate';
import { confirmSignOut } from '@/lib/confirmSignOut';

const HOME_REFRESH_TTL_MS = 60_000;
const HOME_POSTS_LIMIT = 5;
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
      postsSection: {
        marginTop: 0,
      },
      empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
      emptyIcon: { fontSize: 36 },
      emptyText: { ...typography.feedBody, color: colors.textMuted },
    }),
  );
  const {
    me,
    posts,
    likedPosts,
    bookmarkedPosts,
    toggleLike,
    toggleBookmark,
    deletePost,
    fetchPosts,
  } = useApp();
  const { isAuthenticated, signOut } = useAuth();
  const displayName = isAuthenticated
    ? me.arabicName || me.displayName || me.username || 'حسابي'
    : 'ضيف';
  const [editorialStories, setEditorialStories] = useState<EditorialStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [exploreSections, setExploreSections] = useState<HomeExploreCard[]>(FALLBACK_HOME_EXPLORE);
  const lastStoriesAt = useRef(0);
  const hasStoriesData = useRef(false);
  const lastExploreAt = useRef(0);
  const hasExploreData = useRef(false);

  const lastPostsFocusAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastPostsFocusAt.current < HOME_REFRESH_TTL_MS) return;
      lastPostsFocusAt.current = now;
      void fetchPosts('for_you');
    }, [fetchPosts]),
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

  const fetchExplore = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastExploreAt.current < HOME_REFRESH_TTL_MS && hasExploreData.current) {
      return;
    }
    try {
      const data = await fetchHomeExploreSections({ force });
      setExploreSections(data);
      hasExploreData.current = data.length > 0;
      lastExploreAt.current = Date.now();
    } catch (err) {
      console.warn('[HomeScreen] Failed to fetch explore sections:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchStories();
      void fetchExplore();
    }, [fetchStories, fetchExplore]),
  );

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
          displayName={displayName}
          avatarUri={me.avatar}
          isAuthenticated={isAuthenticated}
          onSearch={() => safePush('/search', undefined, router)}
          onProfilePress={() => {
            if (!isAuthenticated) {
              safePush('/auth/phone', undefined, router);
              return;
            }
            safePush('/(tabs)/profile', undefined, router);
          }}
          onManageProfile={() => safePush('/(tabs)/profile', undefined, router)}
          onSettingsPrivacy={() => safePush('/profile/settings', undefined, router)}
          onLogout={() => confirmSignOut(signOut)}
        />

        <AppScrollView contentContainerStyle={styles.scrollContent}>
          <EditorialStoriesBar stories={editorialStories} loading={storiesLoading} />
          <ExploreSarhSection sections={exploreSections} />

          <SectionHeader
            title="أحدث المنشورات"
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
