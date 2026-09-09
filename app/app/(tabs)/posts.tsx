// Powered by OnSpace.AI
// SAFAT — Posts Tab (المنشورات) — X-style For you / Following

import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { AppFlatList } from '@/components/ui/AppFlatList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ds } from '@/constants/designSystem';
import { sarhScreenStyles } from '@/constants/sarhScreen';
import { spacing, type ThemeColors } from '@/constants/theme';
import { AppText, SarhButton, SarhSurface } from '@/design-system/components';
import { colors, radius, space } from '@/design-system';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { getRtlRow } from '@/lib/rtl';
import { PostItem } from '@/components/feature/PostItem';
import { CreatePostFab } from '@/components/feature/CreatePostFab';
import { requireAuth, sharePost, showPostMenu } from '@/lib/postInteractions';
import { openPostDetail } from '@/lib/openPost';
import type { Post } from '@/services/types';

type FeedTab = 'for_you' | 'following';

export default function PostsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, scheme, sarh: screenStyles }) =>
    createPostsStyles(colors, scheme, screenStyles),
  );
  const { postId, openComments } = useLocalSearchParams<{
    postId?: string;
    openComments?: string;
  }>();
  const { isAuthenticated } = useAuth();
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
  const [feedTab, setFeedTab] = useState<FeedTab>('for_you');
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadedTabs = useRef<Set<FeedTab>>(new Set());

  const loadFeed = useCallback(
    async (tab: FeedTab, opts?: { refresh?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      else if (!loadedTabs.current.has(tab) && posts.length === 0) setLoadingFeed(true);
      try {
        if (tab === 'following' && !isAuthenticated) {
          await fetchPosts('for_you');
          loadedTabs.current.add('for_you');
          return;
        }
        await fetchPosts(tab);
        loadedTabs.current.add(tab);
      } finally {
        setLoadingFeed(false);
        setRefreshing(false);
      }
    },
    [fetchPosts, isAuthenticated, posts.length],
  );

  useEffect(() => {
    // Use AppContext cache for "for you" on first paint; only fetch if empty or tab switch
    if (feedTab === 'for_you' && posts.length > 0 && loadedTabs.current.has('for_you')) {
      return;
    }
    if (feedTab === 'for_you' && posts.length > 0 && !loadedTabs.current.has('for_you')) {
      loadedTabs.current.add('for_you');
      return;
    }
    void loadFeed(feedTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when tab changes
  }, [feedTab]);

  useEffect(() => {
    if (!postId) return;
    openPostDetail(router, postId, { focusComment: openComments === '1' });
  }, [postId, openComments, router]);

  const switchTab = (tab: FeedTab) => {
    if (tab === 'following' && !isAuthenticated) {
      requireAuth(false, 'عرض منشورات المتابَعين');
      return;
    }
    setFeedTab(tab);
  };

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Post>) => (
      <PostItem
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
    ),
    [
      likedPosts,
      bookmarkedPosts,
      isAuthenticated,
      toggleLike,
      toggleBookmark,
      deletePost,
      me,
      router,
    ],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const ListEmpty = (
    <View style={styles.empty}>
      <AppText variant="heading2" align="center">
        {feedTab === 'following' ? '👥' : '📝'}
      </AppText>
      <AppText variant="body" color="textMuted" align="center">
        {feedTab === 'following'
          ? 'لا منشورات من حسابات تتابعها بعد'
          : 'لا توجد منشورات بعد'}
      </AppText>
      {feedTab === 'for_you' ? (
        <SarhButton title="أنشئ أول منشور" onPress={() => router.push('/create/post')} />
      ) : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <SarhSurface tone="background" style={styles.topBar}>
          <View style={[styles.tabs, getRtlRow()]}>
            {(['for_you', 'following'] as const).map((tab) => {
              const active = feedTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => switchTab(tab)}
                  style={styles.tab}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <AppText variant="label" color={active ? 'textPrimary' : 'textMuted'}>
                    {tab === 'for_you' ? 'لك' : 'متابعة'}
                  </AppText>
                  {active ? <View style={styles.tabIndicator} /> : null}
                </Pressable>
              );
            })}
          </View>
        </SarhSurface>

        {loadingFeed && posts.length === 0 ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.electricBright} />
          </View>
        ) : (
          <AppFlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.scroll}
            ListEmptyComponent={ListEmpty}
            ListFooterComponent={<View style={{ height: ds.tabBar.height + ds.tabBar.fabLift + ds.space.xxl + 16 }} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void loadFeed(feedTab, { refresh: true })}
                tintColor={colors.electricBright}
              />
            }
            initialNumToRender={6}
            maxToRenderPerBatch={4}
            windowSize={7}
          />
        )}
      </SafeAreaView>

      <CreatePostFab mode="fixed" />
    </View>
  );
}

function createPostsStyles(
  _themeColors: ThemeColors,
  _scheme: 'light' | 'dark',
  sarhStyles: ReturnType<typeof sarhScreenStyles>,
) {
  return StyleSheet.create({
    root: sarhStyles.screenRoot,
    container: sarhStyles.screenRoot,
    topBar: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingHorizontal: space[16],
      paddingBottom: space[8],
      paddingTop: space[8],
    },
    tabs: {
      flexDirection: 'row',
      gap: space[8],
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: space[32],
      position: 'relative',
      paddingBottom: space[8],
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      width: space[20],
      height: 2,
      borderRadius: radius[999],
      backgroundColor: colors.primary,
    },
    scroll: { paddingBottom: spacing.md, flexGrow: 1 },
    empty: {
      alignItems: 'center',
      paddingVertical: space[32],
      gap: space[12],
    },
  });
}
