// Legacy route — redirects to governed butcher application flow.

import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingState } from '@/components/butcherApplication/LoadingState';
import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function ButcherRegisterRedirectScreen() {
  const { styles, gradients } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    gradients: theme.gradients,
  }));
  const router = useRouter();

  useEffect(() => {
    router.replace('/butchers/apply');
  }, [router]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <LinearGradient colors={gradients.hero} style={StyleSheet.absoluteFill} />
      <LoadingState message="جاري التحويل إلى بوابة التسجيل..." />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
  });
}
