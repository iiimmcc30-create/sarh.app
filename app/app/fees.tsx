import { ListingFeePaymentSheet } from '@/components/listing/ListingFeePaymentSheet';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlDirection } from '@/lib/rtl';
import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';
import { useAuth } from '@/contexts/AuthContext';
import { AppText } from '@/design-system/components';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FeeRow = {
  id: string;
  listingId: string;
  commission: number;
  status: string;
  listing: { arabicTitle: string } | null;
};

export default function FeesScreen() {
  const { accessToken } = useAuth();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [payListingId, setPayListingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const res = await authFetch(`${API_BASE}/api/fees`);
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      setFees((json.data?.fees ?? []) as FeeRow[]);
    }
    setLoaded(true);
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={[styles.screen, getRtlDirection()]} edges={['top', 'bottom']}>
      <ScreenHeader title="سداد الرسوم" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="bodySmall" color="textSecondary" style={styles.hint}>
          السداد اختياري. أدخل مبلغ البيع عند السداد لحساب عمولة 1%. فتح الصفحة لا يعني حدوث بيع.
        </AppText>
        {loaded && fees.length === 0 ? (
          <View style={styles.empty}>
            <AppText variant="heading3" align="center">
              لا توجد رسوم مستحقة
            </AppText>
            <AppText variant="caption" color="textMuted" align="center">
              ستظهر هنا عمولات الإعلانات عند تسجيل عملية بيع.
            </AppText>
          </View>
        ) : null}
        {fees.map((fee) => (
          <View key={fee.id} style={styles.card}>
            <AppText variant="label" numberOfLines={2} style={styles.cardTitle}>
              {fee.listing?.arabicTitle ?? fee.listingId}
            </AppText>
            <AppText variant="caption" color="textMuted">
              الحالة: {fee.status} — الالتزام الحالي: {fee.commission} ر.س
            </AppText>
            {fee.status !== 'paid' ? (
              <Pressable
                onPress={() => setPayListingId(fee.listingId)}
                style={styles.payLink}
                accessibilityRole="button"
                accessibilityLabel="سداد الرسوم"
              >
                <AppText variant="label" color="primary" style={styles.payLinkText}>
                  سداد الرسوم
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>
      {payListingId ? (
        <ListingFeePaymentSheet
          visible
          listingId={payListingId}
          onClose={() => {
            setPayListingId(null);
            void load();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    content: {
      padding: spacing.lg,
      gap: spacing.md,
      width: '100%',
      maxWidth: 720,
      alignSelf: 'center',
    },
    hint: { ...typography.secondary, color: colors.textSecondary },
    empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
    card: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTitle: { ...typography.bodyStrong, color: colors.textPrimary },
    payLink: { alignSelf: 'flex-start' },
    payLinkText: { color: colors.textBrandStrong },
  });
}
