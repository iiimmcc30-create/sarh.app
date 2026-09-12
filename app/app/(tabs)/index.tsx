// Powered by OnSpace.AI
// SAFAT — Home Tab (الصفاة)

import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState, useRef } from 'react';
import { EditorialStoriesBar } from '@/components/feature/EditorialStoriesBar';
import { ExploreSarhSection } from '@/components/feature/ExploreSarhSection';
import { HomeCommunityPosts } from '@/components/feature/HomeCommunityPosts';
import { HomeAppBar } from '@/components/ui/HomeAppBar';
import { Screen, ScreenBody } from '@/design-system/layout';
import { useAppUser } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { fetchEditorialStories, type EditorialStory } from '@/services/editorialStories';
import { safePush } from '@/lib/safeNavigate';

const HOME_REFRESH_TTL_MS = 60_000;

export default function HomeScreen() {
  const router = useRouter();
  const { me } = useAppUser();
  const { isAuthenticated } = useAuth();
  const displayName = isAuthenticated
    ? me.arabicName || me.displayName || me.username || 'حسابي'
    : 'ضيف';
  const [editorialStories, setEditorialStories] = useState<EditorialStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const lastStoriesAt = useRef(0);
  const hasStoriesData = useRef(false);

  const fetchStories = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastStoriesAt.current < HOME_REFRESH_TTL_MS && hasStoriesData.current) {
      return;
    }
    if (!hasStoriesData.current) setStoriesLoading(true);
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

  return (
    <Screen edges={['top']}>
      <HomeAppBar
        displayName={displayName}
        avatarUri={me.avatar}
        onSearch={() => safePush('/search', undefined, router)}
        onProfilePress={() => {
          if (!isAuthenticated) {
            safePush('/auth/phone', undefined, router);
            return;
          }
          safePush('/(tabs)/profile', undefined, router);
        }}
        onAvatarPress={() => {
          if (!isAuthenticated) {
            safePush('/auth/phone', undefined, router);
            return;
          }
          safePush('/sidebar', undefined, router);
        }}
      />

      <ScreenBody gutter={false} bottomInset="tabBar" padBottom="md">
        <EditorialStoriesBar stories={editorialStories} loading={storiesLoading} />
        <ExploreSarhSection />
        <HomeCommunityPosts />
      </ScreenBody>
    </Screen>
  );
}
