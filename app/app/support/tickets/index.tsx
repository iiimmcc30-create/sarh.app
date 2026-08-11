import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { getRtlDirection, getRtlRow, rtlForwardIcon } from '@/lib/rtl';
import {
  fetchMyTickets,
  TICKET_STATUS_LABEL_AR,
  TICKET_CATEGORY_LABEL_AR,
  type SupportTicketSummary,
  type SupportTicketCategory,
} from '@/services/support';

export default function SupportTicketsScreen() {
  const router = useRouter();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [items, setItems] = useState<SupportTicketSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchMyTickets();
    setItems(data?.items ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="تذاكر الدعم" showBack />
      <View style={styles.body}>
        <PrimaryButton
          title="إنشاء تذكرة جديدة"
          fullWidth
          onPress={() => router.push('/support/tickets/create' as never)}
        />

        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : items.length === 0 ? (
          <GlassCard style={styles.empty}>
            <AppIcon name="ticket" size={32} color={styles.mutedColor.color} />
            <Text style={styles.emptyTitle}>لا توجد تذاكر بعد</Text>
            <Text style={styles.emptyText}>أنشئ تذكرة جديدة وسنرد عليك في أقرب وقت</Text>
          </GlassCard>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, getRtlDirection()]}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/support/tickets/[id]', params: { id: item.id } } as never)
                }
              >
                <GlassCard style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.ticketNo}>{item.ticketNumber}</Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>
                        {TICKET_STATUS_LABEL_AR[item.status] ?? item.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.subject}>{item.subject}</Text>
                  <View style={styles.cardBottom}>
                    <Text style={styles.meta}>
                      {TICKET_CATEGORY_LABEL_AR[item.category as SupportTicketCategory] ?? item.category}
                    </Text>
                    <AppIcon name={rtlForwardIcon()} size={14} color={styles.mutedColor.color} />
                  </View>
                </GlassCard>
              </Pressable>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    body: { flex: 1, padding: spacing.lg, gap: spacing.lg },
    loader: { marginTop: spacing.xl },
    list: { gap: spacing.md, paddingBottom: spacing.huge },
    card: { gap: spacing.sm },
    cardTop: { ...getRtlRow(), justifyContent: 'space-between', alignItems: 'center' },
    ticketNo: { ...typography.caption, color: colors.textBrandStrong, fontWeight: '600' },
    statusPill: {
      backgroundColor: colors.bgSurface,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    statusText: { ...typography.caption, color: colors.textSecondary },
    subject: { ...typography.bodyStrong, color: colors.textPrimary },
    cardBottom: { ...getRtlRow(), justifyContent: 'space-between', alignItems: 'center' },
    meta: { ...typography.caption, color: colors.textMuted },
    empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
    emptyTitle: { ...typography.h3, color: colors.textPrimary },
    emptyText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
    mutedColor: { color: colors.textMuted },
  });
}
