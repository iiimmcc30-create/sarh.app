// Powered by OnSpace.AI
// SAFAT — Home Tab (الصفاة)

import { useRouter } from 'expo-router';
import { ExploreSarhSection } from '@/components/feature/ExploreSarhSection';
import { HomeFeedSuppliers } from '@/components/feature/HomeFeedSuppliers';
import { HomeLatestListings } from '@/components/feature/HomeLatestListings';
import { HomeQuickAccess } from '@/components/feature/HomeQuickAccess';
import { HomeAppBar } from '@/components/ui/HomeAppBar';
import { Screen, ScreenBody } from '@/design-system/layout';
import { useAppUser } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { safePush } from '@/lib/safeNavigate';

export default function HomeScreen() {
  const router = useRouter();
  const { me } = useAppUser();
  const { isAuthenticated } = useAuth();
  const displayName = isAuthenticated
    ? me.arabicName || me.displayName || me.username || 'حسابي'
    : 'ضيف';

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
        <ExploreSarhSection />
        <HomeQuickAccess />
        <HomeFeedSuppliers />
        <HomeLatestListings />
      </ScreenBody>
    </Screen>
  );
}
