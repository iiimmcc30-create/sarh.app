import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlText, getRtlRow } from '@/lib/rtl';
import { useAuth } from '@/contexts/AuthContext';
import { ButcherProfile } from '@/services/butcherData';
import {
  fetchFavoriteButchers,
  removeFavoriteLocal,
  toggleButcherFavorite,
} from '@/services/butcherFavorites';
import { resolveMediaUrl } from '@/services/media';

const COVER_FALLBACK =
  'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80';

export default function ButcherFavoritesScreen() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [favorites, setFavorites] = useState<ButcherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = user?.id ?? '';

  const load = useCallback(async () => {
    if (!accessToken || !userId) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchFavoriteButchers(accessToken, userId);
      setFavorites(data);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken, userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const handleRemove = async (butcher: ButcherProfile) => {
    if (!accessToken || !userId) return;
    try {
      await toggleButcherFavorite(accessToken, userId, butcher.id, true);
    } catch {
      await removeFavoriteLocal(userId, butcher.id);
    }
    setFavorites((prev) => prev.filter((b) => b.id !== butcher.id));
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader
        title="تفضيلاتي"
        showBack
        rightIcon="menu-burger"
        onRightPress={() => router.push('/butchers-market-sidebar')}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.electricBright} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.electricBright}
            />
          }
        >
          {favorites.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>❤️</Text>
              <Text style={styles.emptyTitle}>لا توجد ملاحم مفضلة</Text>
              <Text style={styles.emptySub}>أضف ملاحمك المفضلة من قائمة الملاحم</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/butchers')}>
                <Text style={styles.emptyBtnText}>تصفح الملاحم</Text>
              </Pressable>
            </View>
          ) : (
            favorites.map((butcher) => {
              const isOpen = butcher.workingHours.isOpen;
              return (
                <View key={butcher.id} style={styles.card}>
                  <View style={styles.thumbWrap}>
                    <Image
                      source={{
                        uri:
                          resolveMediaUrl(butcher.cover) ??
                          resolveMediaUrl(butcher.logo) ??
                          COVER_FALLBACK,
                      }}
                      style={styles.thumb}
                      contentFit="cover"
                    />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.name} numberOfLines={1}>
                      {butcher.nameAr}
                    </Text>
                    <View style={[styles.ratingRow, getRtlRow()]}>
                      <AppIcon name="star" size={14} color={colors.gold} />
                      <Text style={styles.rating}>{butcher.rating.toFixed(1)}</Text>
                      <Text style={styles.reviews}>({butcher.reviewCount})</Text>
                    </View>
                    <View
                      style={[
                        styles.openBadge,
                        { backgroundColor: isOpen ? colors.success + '22' : colors.danger + '22' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.openText,
                          { color: isOpen ? colors.success : colors.danger },
                        ]}
                      >
                        {isOpen ? 'مفتوح الآن' : 'مغلق حالياً'}
                      </Text>
                    </View>
                    <View style={[styles.actions, getRtlRow()]}>
                      <Pressable
                        style={styles.visitBtn}
                        onPress={() =>
                          router.push({ pathname: '/butchers/[id]', params: { id: butcher.id } })
                        }
                      >
                        <Text style={styles.visitBtnText}>زيارة الملحمة</Text>
                      </Pressable>
                      <Pressable style={styles.removeBtn} onPress={() => void handleRemove(butcher)}>
                        <AppIcon name="heart" size={18} color={colors.rose} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgDeep },
    scroll: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
    card: {
      ...getRtlRow(),
      alignItems: 'stretch',
      backgroundColor: colors.bgSurface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
      minHeight: 120,
    },
    thumbWrap: {
      width: 120,
      flexShrink: 0,
      alignSelf: 'stretch',
      backgroundColor: colors.bgElevated,
      overflow: 'hidden',
    },
    thumb: {
      ...StyleSheet.absoluteFillObject,
    },
    cardBody: {
      flex: 1,
      padding: spacing.md,
      gap: 6,
      justifyContent: 'center',
    },
    name: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      fontWeight: '800',
      writingDirection: 'rtl',
      ...getRtlText(),
    },
    ratingRow: { alignItems: 'center', gap: 4 },
    rating: { ...typography.caption, color: colors.gold, fontWeight: '800' },
    reviews: { ...typography.caption, color: colors.textMuted },
    openBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    openText: { ...typography.micro, fontWeight: '700', writingDirection: 'rtl' },
    actions: { marginTop: spacing.sm, gap: spacing.sm, alignItems: 'center' },
    visitBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radius.lg,
      backgroundColor: colors.electric + '18',
      borderWidth: 1,
      borderColor: colors.electric + '44',
      alignItems: 'center',
    },
    visitBtnText: {
      ...typography.caption,
      color: colors.electricBright,
      fontWeight: '800',
      writingDirection: 'rtl',
    },
    removeBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    empty: {
      alignItems: 'center',
      paddingVertical: 80,
      gap: spacing.sm,
    },
    emptyIcon: { fontSize: 48 },
    emptyTitle: { ...typography.h3, color: colors.textPrimary },
    emptySub: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
      paddingHorizontal: spacing.xl,
    },
    emptyBtn: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: 12,
      borderRadius: radius.pill,
      backgroundColor: colors.electric,
    },
    emptyBtnText: {
      ...typography.bodyStrong,
      color: '#fff',
      fontWeight: '800',
      writingDirection: 'rtl',
    },
  });
}
