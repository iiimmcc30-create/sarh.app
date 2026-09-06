// Powered by OnSpace.AI
// SAFAT — Home Tab (الصفاة)

import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ds } from '@/constants/designSystem';
import { spacing } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { EditorialStoriesBar } from '@/components/feature/EditorialStoriesBar';
import { ExploreSarhSection } from '@/components/feature/ExploreSarhSection';
import { HomeMinistryOrgCard } from '@/components/feature/HomeMinistryOrgCard';
import { fetchEditorialStories, type EditorialStory } from '@/services/editorialStories';
import {
  fetchOfficialServices,
  type OfficialService,
} from '@/services/officialServices';
import { HomeAppBar } from '@/components/ui/HomeAppBar';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { safePush } from '@/lib/safeNavigate';

const HOME_REFRESH_TTL_MS = 60_000;
const TAB_BAR_CLEARANCE = ds.tabBar.height + ds.tabBar.fabLift + ds.space.xxl + 16;

export default function HomeScreen() {
  const router = useRouter();
  const styles = useThemedStyles(({ sarh }) =>
    StyleSheet.create({
      root: sarh.screenRoot,
      container: sarh.screenRoot,
      scrollContent: {
        paddingBottom: spacing.lg,
      },
    }),
  );
  const { me } = useApp();
  const { isAuthenticated } = useAuth();
  const displayName = isAuthenticated
    ? me.arabicName || me.displayName || me.username || 'حسابي'
    : 'ضيف';
  const [editorialStories, setEditorialStories] = useState<EditorialStory[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [ministryServices, setMinistryServices] = useState<OfficialService[]>([]);
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

  const fetchMinistry = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastMinistryAt.current < HOME_REFRESH_TTL_MS && hasMinistryData.current) {
      return;
    }
    setMinistryLoading(true);
    try {
      const { services } = await fetchOfficialServices();
      setMinistryServices(services);
      hasMinistryData.current = services.length > 0;
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
    <View style={styles.root}>
      <SafeAreaView style={styles.container} edges={['top']}>
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

        <AppScrollView contentContainerStyle={styles.scrollContent}>
          <EditorialStoriesBar stories={editorialStories} loading={storiesLoading} />
          <ExploreSarhSection />
          <HomeMinistryOrgCard
            serviceCount={ministryServices.filter((item) => item.active !== false).length}
            loading={ministryLoading}
          />
          <View style={{ height: TAB_BAR_CLEARANCE }} />
        </AppScrollView>
      </SafeAreaView>
    </View>
  );
}
