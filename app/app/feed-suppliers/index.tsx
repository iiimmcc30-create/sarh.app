import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Image, uriSource } from '@/components/ui/AppImage';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { spacing, type ThemeColors } from '@/constants/theme';
import { AppText, SarhChip, SarhChipRow, SarhInput } from '@/design-system/components';
import { Row, Screen, ScreenBody } from '@/design-system/layout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { FEED_CATEGORY_FILTERS, type FeedProductCategory } from '@/lib/feedSuppliers';
import { cloudinaryFitUrl } from '@/lib/listingMedia';
import { safePush } from '@/lib/safeNavigate';
import { showToast } from '@/lib/toast';
import { fetchFeedSuppliers, type FeedSupplier } from '@/services/feedSuppliers';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

export default function FeedSuppliersScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors: c }) => createStyles(c));
  const [suppliers, setSuppliers] = useState<FeedSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FeedProductCategory | 'all'>('all');
  const [hasData, setHasData] = useState(false);
  const queryRef = useRef(query);
  const categoryRef = useRef(category);
  const hasDataRef = useRef(false);
  const skipCategoryEffect = useRef(true);
  queryRef.current = query;
  categoryRef.current = category;

  const load = useCallback(async (opts?: { refresh?: boolean }) => {
    if (opts?.refresh) setRefreshing(true);
    else if (!hasDataRef.current) setLoading(true);
    try {
      const rows = await fetchFeedSuppliers({
        q: queryRef.current,
        category: categoryRef.current,
      });
      setSuppliers(rows);
      hasDataRef.current = true;
      setHasData(true);
    } catch {
      showToast('تعذر تحميل الموردين', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (skipCategoryEffect.current) {
      skipCategoryEffect.current = false;
      return;
    }
    void load();
  }, [category, load]);

  return (
    <Screen edges={['top']} keyboard>
      <ScreenHeader variant="screen" title="موردو الأعلاف" showBack />
      <ScreenBody
        padTop="md"
        padBottom="xxxl"
        gap="md"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void load({ refresh: true })} />
        }
      >
        <SarhInput
          appearance="theme"
          placeholder="ابحث عن مورد أو منتج..."
          value={query}
          onChangeText={setQuery}
          icon="search"
          returnKeyType="search"
          onSubmitEditing={() => void load()}
        />
        <SarhChipRow contentPaddingHorizontal={0}>
          {FEED_CATEGORY_FILTERS.map((item) => (
            <SarhChip
              key={item.value}
              appearance="filter"
              compact
              label={item.label}
              selected={category === item.value}
              onPress={() => setCategory(item.value)}
            />
          ))}
        </SarhChipRow>

        {loading && !hasData ? (
          <ActivityIndicator color={colors.electricBright} style={styles.loader} />
        ) : suppliers.length === 0 ? (
          <AppText variant="bodySmall" color="textMuted" align="center">
            لا يوجد موردون متاحون حالياً
          </AppText>
        ) : (
          suppliers.map((supplier) => (
            <Pressable
              key={supplier.id}
              onPress={() =>
                safePush(
                  { pathname: '/feed-suppliers/[id]', params: { id: supplier.id } },
                  undefined,
                  router,
                )
              }
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={supplier.nameAr}
            >
              <View style={styles.logoWrap}>
                {uriSource(cloudinaryFitUrl(supplier.logo || supplier.cover, 'row')) ? (
                  <Image
                    source={uriSource(cloudinaryFitUrl(supplier.logo || supplier.cover, 'row'))}
                    style={styles.logo}
                    contentFit="cover"
                  />
                ) : (
                  <AppText variant="label">أعلاف</AppText>
                )}
              </View>
              <View style={styles.copy}>
                <Row gap="xs" align="center">
                  <AppText variant="label" numberOfLines={1} style={styles.name}>
                    {supplier.nameAr}
                  </AppText>
                  {supplier.verified ? (
                    <>
                      <VerificationBadge size={16} />
                      <AppText variant="caption" color="primary">
                        موثق
                      </AppText>
                    </>
                  ) : null}
                </Row>
                <AppText variant="caption" color="textMuted" numberOfLines={1}>
                  {supplier.cityAr}
                </AppText>
                {supplier.description ? (
                  <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                    {supplier.description}
                  </AppText>
                ) : null}
                <AppText variant="caption" color="textMuted" numberOfLines={1}>
                  {supplier.productCount === 1
                    ? 'منتج واحد'
                    : `${supplier.productCount ?? 0} منتجات`}
                </AppText>
              </View>
            </Pressable>
          ))
        )}
      </ScreenBody>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    loader: { marginTop: spacing.xxl },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 16,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    pressed: { opacity: 0.94 },
    logoWrap: {
      width: 64,
      height: 64,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    logo: { width: '100%', height: '100%' },
    copy: { flex: 1, minWidth: 0, gap: 4 },
    name: { flexShrink: 1, minWidth: 0 },
  });
}
