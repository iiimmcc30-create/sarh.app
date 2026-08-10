import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isComplete: onboardingComplete, isLoading: onboardingLoading } = useOnboarding();

  if (isLoading || onboardingLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B1622' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <Redirect href={'/onboarding' as any} />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/phone" />;
}
