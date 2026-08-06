import { ButchersMarketSidebarPanel } from '@/components/feature/ButchersMarketSidebar';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { rtlRow } from '@/lib/rtl';

export default function ButchersMarketSidebarScreen() {
  const router = useRouter();

  return (
    <View style={[styles.backdrop, rtlRow]}>
      <ButchersMarketSidebarPanel onClose={() => router.back()} />
      <Pressable style={styles.backdropTap} onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdropTap: {
    flex: 1,
  },
});
