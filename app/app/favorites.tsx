import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PostItem } from '@/components/feature/PostItem';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlText } from '@/lib/rtl';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { requireAuth, sharePost, showPostMenu } from '@/lib/postInteractions';
import { openPostDetail } from '@/lib/openPost';
import type { Post } from '@/services/types';

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      else setLoading(true);
      try {
        await fetchPosts('for_you');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchPosts],
  );

  useFocusEffect(
    useCallback(() => {
      if (posts.length === 0) {
        void load();
      }
    }, [load, posts.length]),
  );

  const favorites = useMemo(
    () => posts.filter((post) => bookmarkedPosts.has(post.id)),
    [posts, bookmarkedPosts],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Post>) => (
      <PostItem
        post={{
          ...item,
          liked: likedPosts.has(item.id),
          bookmarked: true,
        }}
        onPress={() => openPostDetail(router, item.id)}
        onLike={() => requireAuth(isAuthenticated, 'الإعجاب') && toggleLike(item.id)}
        onComment={() => openPostDetail(router, item.id, { focusComment: isAuthenticated })}
        onBookmark={() => requireAuth(isAuthenticated, 'الحفظ') && toggleBookmark(item.id)}
        onShare={() => sharePost(item)}
        onMenu={() => showPostMenu(item, me, router, deletePost, isAuthenticated)}
      />
    ),
    [
      likedPosts,
      isAuthenticated,
      toggleLike,
      toggleBookmark,
      deletePost,
      me,
      router,
    ],
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader title="المفضلة" showBack />

      {loading && favorites.length === 0 ? (
        <ActivityIndicator size="large" color={colors.electricBright} style={styles.loader} />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={favorites.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load({ refresh: true })}
              tintColor={colors.electricBright}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔖</Text>
              <Text style={styles.emptyTitle}>لا توجد عناصر مفضلة</Text>
              <Text style={styles.emptySub}>
                احفظ المنشورات من مجلس سرح لتظهر هنا
              </Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/(tabs)/posts')}>
                <Text style={styles.emptyBtnText}>تصفح مجلس سرح</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.screenRoot,
    },
    loader: {
      marginTop: 60,
    },
    list: {
      paddingBottom: spacing.xxl,
    },
    emptyList: {
      flexGrow: 1,
      paddingBottom: spacing.xxl,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingTop: 80,
      gap: spacing.sm,
    },
    emptyIcon: {
      fontSize: 40,
      marginBottom: spacing.sm,
    },
    emptyTitle: {
      ...typography.h3,
      fontWeight: '800',
      color: colors.textPrimary,
      ...getRtlText(),
    },
    emptySub: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      ...getRtlText(),
    },
    emptyBtn: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.lg,
      backgroundColor: colors.electric,
    },
    emptyBtnText: {
      ...typography.body,
      fontWeight: '700',
      color: '#fff',
      ...getRtlText(),
    },
  });
}
