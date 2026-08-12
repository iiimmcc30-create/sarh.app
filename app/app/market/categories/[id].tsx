import { AppIcon } from '@/components/ui/FlaticonIcon';
import { menuCardStyle } from '@/components/feature/SidebarMenu';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { rtlBackIcon } from '@/lib/rtl';
import { safePush } from '@/lib/safeNavigate';
import {
  fetchMarketCategory,
  fetchMarketSubcategories,
  type MarketCategory,
} from '@/services/categories';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MarketSubcategoriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  const [parent, setParent] = useState<MarketCategory | null>(null);
  const [subs, setSubs] = useState<MarketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [cat, children] = await Promise.all([
        fetchMarketCategory(id),
        fetchMarketSubcategories(id),
      ]);
      if (!cat) {
        setError('التصنيف غير موجود');
        setParent(null);
        setSubs([]);
        return;
      }
      setParent(cat);
      setSubs(children);
    } catch {
      setError('تعذّر تحميل التصنيفات');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSelectSub = (sub: MarketCategory) => {
    if (!parent) return;
    safePush(
      {
        pathname: '/market/browse',
        params: {
          categoryId: parent.id,
          subcategoryId: sub.id,
          parentName: parent.nameAr,
          parentEmoji: parent.emoji ?? '',
          subName: sub.nameAr,
          subEmoji: sub.emoji ?? '',
        },
      },
      undefined,
      router,
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleShell}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {parent?.emoji ? `${parent.emoji} ` : ''}
            {parent?.nameAr ?? 'التصنيف'}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.electric} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.subtitleShell}>
            <Text style={styles.subtitle}>اختر النوع</Text>
          </View>
          <View style={styles.list}>
            {subs.map((sub) => (
              <Pressable
                key={sub.id}
                onPress={() => onSelectSub(sub)}
                style={({ pressed }) => [
                  styles.row,
                  menuCardStyle(colors),
                  pressed && styles.rowPressed,
                ]}
              >
                <AppIcon name="angle-left" size={16} color={colors.textMuted} />
                <View style={styles.rowLabelShell}>
                  <Text style={styles.rowLabel} numberOfLines={1}>
                    {sub.emoji ? `${sub.emoji} ` : ''}
                    {sub.nameAr}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.screenRoot,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    backBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleShell: {
      flex: 1,
      direction: 'ltr',
      minWidth: 0,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxxl,
      gap: spacing.md,
    },
    subtitleShell: {
      width: '100%',
      direction: 'ltr',
    },
    subtitle: {
      ...typography.body,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    list: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    rowPressed: {
      opacity: 0.88,
    },
    rowLabelShell: {
      flex: 1,
      direction: 'ltr',
      minWidth: 0,
    },
    rowLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.xl,
    },
    errorText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    retryBtn: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 12,
      backgroundColor: colors.bgElevated,
    },
    retryText: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '600',
      writingDirection: 'rtl',
    },
  });
}
