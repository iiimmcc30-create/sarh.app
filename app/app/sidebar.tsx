import { AppSidebar } from '@/components/feature/AppSidebar';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { getRtlRow } from '@/lib/rtl';

export default function SidebarScreen() {
  const router = useRouter();

  return (
    <View style={[styles.backdrop, getRtlRow()]}>
      <AppSidebar onClose={() => router.back()} />
      <Pressable style={styles.backdropTap} onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  backdropTap: {
    flex: 1,
  },
});
