import { ListingFeePaymentSheet } from '@/components/listing/ListingFeePaymentSheet';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlText, getRtlDirection, getRtlRow } from '@/lib/rtl';
import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FeeRow = {
  id: string;
  listingId: string;
  commission: number;
  status: string;
  listing: { arabicTitle: string } | null;
};

export default function FeesScreen() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [payListingId, setPayListingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const res = await authFetch(`${API_BASE}/api/fees`);
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      setFees((json.data?.fees ?? []) as FeeRow[]);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={[styles.screen, getRtlDirection()]}>
      <View style={[styles.header, getRtlRow()]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <AppIcon name="chevron-forward" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, getRtlText()]}>سداد الرسوم</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.hint, getRtlText()]}>
          السداد اختياري. أدخل مبلغ البيع عند السداد لحساب عمولة 1%. فتح الصفحة لا يعني حدوث بيع.
        </Text>
        {fees.map((fee) => (
          <View key={fee.id} style={styles.card}>
            <Text style={[styles.cardTitle, getRtlText()]}>
              {fee.listing?.arabicTitle ?? fee.listingId}
            </Text>
            <Text style={[styles.cardMeta, getRtlText()]}>
              الحالة: {fee.status} — الالتزام الحالي: {fee.commission} ر.س
            </Text>
            {fee.status !== 'paid' ? (
              <Pressable
                onPress={() => setPayListingId(fee.listingId)}
                style={styles.payLink}
              >
                <Text style={[styles.payLinkText, getRtlText()]}>سداد الرسوم</Text>
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
    header: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    title: { ...typography.h3, color: colors.textPrimary, flex: 1 },
    content: { padding: spacing.lg, gap: spacing.md },
    hint: { ...typography.secondary, color: colors.textSecondary },
    card: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTitle: { ...typography.bodyStrong, color: colors.textPrimary },
    cardMeta: { ...typography.caption, color: colors.textMuted },
    payLink: { alignSelf: 'flex-start' },
    payLinkText: { ...typography.bodyStrong, color: colors.textBrandStrong },
  });
}
