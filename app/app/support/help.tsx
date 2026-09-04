import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { getRtlDirection } from '@/lib/rtl';
import {
  createTicket,
  fetchMyHelpOrders,
  type HelpOrderSummary,
} from '@/services/support';

type Step = 'choose' | 'order' | 'describe';
type HelpKind = 'ORDER_HELP' | 'OTHER_HELP';

export default function CustomerHelpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const presetOrderId = typeof params.orderId === 'string' ? params.orderId : undefined;

  const [step, setStep] = useState<Step>(presetOrderId ? 'describe' : 'choose');
  const [kind, setKind] = useState<HelpKind>(presetOrderId ? 'ORDER_HELP' : 'OTHER_HELP');
  const [orders, setOrders] = useState<HelpOrderSummary[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderId, setOrderId] = useState<string | undefined>(presetOrderId);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingOrders(true);
    void fetchMyHelpOrders()
      .then((data) => {
        if (!cancelled) setOrders(data?.orders ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoadingOrders(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === orderId),
    [orders, orderId],
  );

  const openKind = (next: HelpKind) => {
    setKind(next);
    if (next === 'ORDER_HELP') {
      setStep('order');
      return;
    }
    setOrderId(undefined);
    setStep('describe');
  };

  const submit = async () => {
    if (description.trim().length < 3) return;
    if (kind === 'ORDER_HELP' && !orderId) {
      Alert.alert('اختر طلباً', 'لا يمكن فتح بلاغ مشكلة في الطلب بدون طلب.');
      return;
    }
    setSubmitting(true);
    const res = await createTicket({
      helpKind: kind,
      orderId: kind === 'ORDER_HELP' ? orderId : undefined,
      description: description.trim(),
    });
    setSubmitting(false);
    if (!res.ok || !res.ticket?.id) {
      Alert.alert('تعذر فتح البلاغ', res.error ?? 'حاول مرة أخرى');
      return;
    }
    router.replace({
      pathname: '/support/tickets/[id]',
      params: { id: res.ticket.id },
    } as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="المساعدة" showBack />
      <ScrollView contentContainerStyle={[styles.content, getRtlDirection()]}>
        {step === 'choose' ? (
          <>
            <Text style={styles.lead}>كيف نقدر نساعدك؟</Text>
            <Pressable style={styles.choice} onPress={() => openKind('ORDER_HELP')}>
              <Text style={styles.choiceTitle}>مشكلة في الطلب</Text>
            </Pressable>
            <Pressable style={styles.choice} onPress={() => openKind('OTHER_HELP')}>
              <Text style={styles.choiceTitle}>مساعدة في شيء آخر</Text>
            </Pressable>
          </>
        ) : null}

        {step === 'order' ? (
          <>
            <Text style={styles.lead}>اختر الطلب</Text>
            {loadingOrders ? <ActivityIndicator /> : null}
            {!loadingOrders && orders.length === 0 ? (
              <Text style={styles.hint}>لا توجد طلبات مرتبطة بحسابك. يمكنك طلب مساعدة في شيء آخر.</Text>
            ) : (
              orders.map((order) => (
                <Pressable
                  key={order.id}
                  style={[styles.choice, orderId === order.id && styles.choiceOn]}
                  onPress={() => {
                    setOrderId(order.id);
                    setStep('describe');
                  }}
                >
                  <Text style={styles.choiceTitle}>{order.orderNumber}</Text>
                  <Text style={styles.choiceSub}>
                    {order.butcher?.nameAr ?? ''} · {order.status}
                  </Text>
                </Pressable>
              ))
            )}
            <Pressable onPress={() => setStep('choose')}>
              <Text style={styles.backLink}>رجوع</Text>
            </Pressable>
          </>
        ) : null}

        {step === 'describe' ? (
          <>
            <Text style={styles.lead}>
              {kind === 'ORDER_HELP' ? 'ما المشكلة في الطلب؟' : 'ما الذي تحتاج المساعدة فيه؟'}
            </Text>
            {kind === 'ORDER_HELP' && selectedOrder ? (
              <GlassCard>
                <Text style={styles.choiceSub}>الطلب {selectedOrder.orderNumber}</Text>
              </GlassCard>
            ) : null}
            <AppTextInput
              label={kind === 'ORDER_HELP' ? 'اكتب وصف المشكلة...' : 'اكتب المشكلة أو استفسارك...'}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              style={styles.textArea}
            />
            <PrimaryButton
              title="فتح البلاغ"
              fullWidth
              loading={submitting}
              disabled={submitting || description.trim().length < 3 || (kind === 'ORDER_HELP' && !orderId)}
              onPress={() => void submit()}
            />
            <Pressable onPress={() => setStep(kind === 'ORDER_HELP' ? 'order' : 'choose')}>
              <Text style={styles.backLink}>رجوع</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.huge },
    lead: { ...typography.h3, color: colors.textPrimary,  },
    choice: {
      borderRadius: 16,
      padding: spacing.lg,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      gap: 4,
    },
    choiceOn: { borderColor: colors.electric },
    choiceTitle: { ...typography.bodyStrong, color: colors.textPrimary,  },
    choiceSub: { ...typography.caption, color: colors.textMuted,  },
    hint: { ...typography.body, color: colors.textMuted,  },
    textArea: { minHeight: 140, textAlignVertical: 'top' },
    backLink: { ...typography.caption, color: colors.electric, textAlign: 'center', marginTop: spacing.sm },
  });
}
