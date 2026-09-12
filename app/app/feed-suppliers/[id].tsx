import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { Image, uriSource } from '@/components/ui/AppImage';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { spacing, type ThemeColors } from '@/constants/theme';
import { AppText, SarhButton, SarhCard } from '@/design-system/components';
import { Row, Screen, ScreenBody } from '@/design-system/layout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { feedCategoryLabel, mapsUrl, telUrl, whatsappUrl } from '@/lib/feedSuppliers';
import { cloudinaryFitUrl } from '@/lib/listingMedia';
import { showToast } from '@/lib/toast';
import { fetchFeedSupplier, type FeedProduct, type FeedSupplier } from '@/services/feedSuppliers';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

export default function FeedSupplierDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors: c }) => createStyles(c));
  const [supplier, setSupplier] = useState<FeedSupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FeedProduct | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchFeedSupplier(id);
      setSupplier(data);
    } catch {
      showToast('تعذر تحميل المورد', 'error');
      setSupplier(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const openLink = (url: string | null, fallback: string) => {
    if (!url) {
      showToast(fallback, 'error');
      return;
    }
    void Linking.openURL(url);
  };

  if (loading) {
    return (
      <Screen edges={['top']}>
        <ScreenHeader variant="screen" title="موردو الأعلاف" showBack />
        <ScreenBody scroll={false}>
          <ActivityIndicator color={colors.electricBright} style={styles.loader} />
        </ScreenBody>
      </Screen>
    );
  }

  if (!supplier) {
    return (
      <Screen edges={['top']}>
        <ScreenHeader variant="screen" title="موردو الأعلاف" showBack />
        <ScreenBody>
          <AppText variant="bodySmall" color="textMuted" align="center">
            لا يوجد موردون متاحون حالياً
          </AppText>
        </ScreenBody>
      </Screen>
    );
  }

  const phone = supplier.phone || supplier.whatsapp;
  const wa = supplier.whatsapp || supplier.phone;
  const products = supplier.products ?? [];

  return (
    <Screen edges={['top']}>
      <ScreenHeader variant="screen" title={supplier.nameAr} showBack />
      <ScreenBody padTop="md" padBottom="xxxl" gap="md">
        <Row gap="md" align="center">
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
          <View style={styles.identity}>
            <Row gap="xs" align="center">
              <AppText variant="heading3" numberOfLines={2} style={styles.name}>
                {supplier.nameAr}
              </AppText>
              {supplier.verified ? (
                <>
                  <VerificationBadge size={18} />
                  <AppText variant="caption" color="primary">
                    موثق
                  </AppText>
                </>
              ) : null}
            </Row>
            <AppText variant="caption" color="textMuted" numberOfLines={1}>
              {[supplier.districtAr, supplier.cityAr].filter(Boolean).join('، ')}
            </AppText>
          </View>
        </Row>

        {supplier.description ? (
          <AppText variant="bodySmall" color="textSecondary">
            {supplier.description}
          </AppText>
        ) : null}
        {supplier.hoursAr ? (
          <AppText variant="caption" color="textMuted">
            ساعات العمل: {supplier.hoursAr}
          </AppText>
        ) : null}
        {supplier.addressAr ? (
          <AppText variant="caption" color="textMuted">
            {supplier.addressAr}
          </AppText>
        ) : null}

        <Row gap="sm" wrap>
          <SarhButton
            title="واتساب"
            variant="primary"
            size="sm"
            onPress={() => openLink(whatsappUrl(wa), 'رقم واتساب غير متوفر')}
          />
          <SarhButton
            title="اتصال"
            variant="secondary"
            size="sm"
            onPress={() => openLink(telUrl(phone), 'رقم الهاتف غير متوفر')}
          />
          <SarhButton
            title="عرض الموقع"
            variant="ghost"
            size="sm"
            onPress={() =>
              openLink(
                mapsUrl(supplier),
                'موقع المورد غير متوفر',
              )
            }
          />
        </Row>

        <AppText variant="heading3">المنتجات</AppText>
        {products.length === 0 ? (
          <AppText variant="bodySmall" color="textMuted">
            لا توجد منتجات متاحة حالياً
          </AppText>
        ) : (
          products.map((product) => {
            const open = selected?.id === product.id;
            return (
              <Pressable
                key={product.id}
                onPress={() => setSelected(open ? null : product)}
                style={({ pressed }) => [styles.product, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={product.nameAr}
              >
                {uriSource(cloudinaryFitUrl(product.imageUrl, 'row')) ? (
                  <Image
                    source={uriSource(cloudinaryFitUrl(product.imageUrl, 'row'))}
                    style={styles.productImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.productImage} />
                )}
                <View style={styles.productCopy}>
                  <AppText variant="label" numberOfLines={1}>
                    {product.nameAr}
                  </AppText>
                  <AppText variant="caption" color="textMuted" numberOfLines={1}>
                    {feedCategoryLabel(product.category)}
                  </AppText>
                  {product.description ? (
                    <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                      {product.description}
                    </AppText>
                  ) : null}
                  {product.weightLabel ? (
                    <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                      {product.weightLabel}
                    </AppText>
                  ) : null}
                  <AppText variant="caption" color={product.available ? 'success' : 'textMuted'}>
                    {product.available ? 'متوفر' : 'غير متوفر'}
                  </AppText>
                </View>
              </Pressable>
            );
          })
        )}

        {selected ? (
          <SarhCard padding="md" style={styles.detailCard}>
            {uriSource(cloudinaryFitUrl(selected.imageUrl, 'row')) ? (
              <Image
                source={uriSource(cloudinaryFitUrl(selected.imageUrl, 'row'))}
                style={styles.detailImage}
                contentFit="cover"
              />
            ) : null}
            <AppText variant="heading3">{selected.nameAr}</AppText>
            <AppText variant="caption" color="textMuted">
              {feedCategoryLabel(selected.category)}
            </AppText>
            {selected.weightLabel ? (
              <AppText variant="bodySmall">{selected.weightLabel}</AppText>
            ) : null}
            <AppText variant="caption" color={selected.available ? 'success' : 'textMuted'}>
              {selected.available ? 'متوفر' : 'غير متوفر'}
            </AppText>
            {selected.description ? (
              <AppText variant="bodySmall" color="textSecondary">
                {selected.description}
              </AppText>
            ) : null}
            <AppText variant="caption" color="textMuted">
              {supplier.nameAr}
            </AppText>
            <Row gap="sm">
              <SarhButton
                title="واتساب"
                variant="primary"
                size="sm"
                onPress={() => openLink(whatsappUrl(wa), 'رقم واتساب غير متوفر')}
              />
              <SarhButton
                title="اتصال"
                variant="secondary"
                size="sm"
                onPress={() => openLink(telUrl(phone), 'رقم الهاتف غير متوفر')}
              />
            </Row>
          </SarhCard>
        ) : null}
      </ScreenBody>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    loader: { marginTop: spacing.xxl },
    logoWrap: {
      width: 72,
      height: 72,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    logo: { width: '100%', height: '100%' },
    identity: { flex: 1, minWidth: 0, gap: 4 },
    name: { flexShrink: 1, minWidth: 0 },
    product: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 16,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    pressed: { opacity: 0.94 },
    productImage: {
      width: 72,
      height: 72,
      borderRadius: 12,
      backgroundColor: colors.bgElevated,
      flexShrink: 0,
    },
    productCopy: { flex: 1, minWidth: 0, gap: 3 },
    detailCard: { gap: spacing.sm },
    detailImage: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: 12,
      backgroundColor: colors.bgElevated,
    },
  });
}
