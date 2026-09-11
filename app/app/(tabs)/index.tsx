// Powered by OnSpace.AI
// SAFAT — Home Tab (الصفاة)

import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState, useRef } from 'react';
import { EditorialStoriesBar } from '@/components/feature/EditorialStoriesBar';
import { ExploreSarhSection } from '@/components/feature/ExploreSarhSection';
import { HomeMinistryOrgCard } from '@/components/feature/HomeMinistryOrgCard';
import { HomeAppBar } from '@/components/ui/HomeAppBar';
import { Screen, ScreenBody } from '@/design-system/layout';
import { useAppUser } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { fetchEditorialStories, type EditorialStory } from '@/services/editorialStories';
import {
  fetchMinistryAccount,
  fetchOfficialServices,
  type MinistryAccount,
  type OfficialService,
} from '@/services/officialServices';
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
  const [ministryServices, setMinistryServices] = useState<OfficialService[]>([]);
  const [ministryAccount, setMinistryAccount] = useState<MinistryAccount | null>(null);
  const [ministryLoading, setMinistryLoading] = useState(false);
  const lastStoriesAt = useRef(0);
  const hasStoriesData = useRef(false);
  const lastMinistryAt = useRef(0);
  const hasMinistryData = useRef(false);

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

  const fetchMinistry = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastMinistryAt.current < HOME_REFRESH_TTL_MS && hasMinistryData.current) {
      return;
    }
    if (!hasMinistryData.current) setMinistryLoading(true);
    try {
      const [{ services }, account] = await Promise.all([
        fetchOfficialServices(),
        fetchMinistryAccount(),
      ]);
      setMinistryServices(services);
      setMinistryAccount(account);
      hasMinistryData.current = Boolean(account || services.length > 0);
      lastMinistryAt.current = Date.now();
    } catch (err) {
      console.warn('[HomeScreen] Failed to fetch ministry services:', err);
    } finally {
      setMinistryLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchStories();
      void fetchMinistry();
    }, [fetchStories, fetchMinistry]),
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
        <HomeMinistryOrgCard
          account={ministryAccount}
          serviceCount={ministryServices.filter((item) => item.active !== false).length}
          loading={ministryLoading}
        />
      </ScreenBody>
    </Screen>
  );
}
