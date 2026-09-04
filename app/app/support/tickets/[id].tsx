import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useSupportTicketSocket } from '@/hooks/useSupportTicketSocket';
import { useAuth } from '@/contexts/AuthContext';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { getRtlDirection } from '@/lib/rtl';
import { messageAuthorLabel } from '@/lib/supportRealtime';
import {
  fetchTicket,
  replyToTicket,
  TICKET_STATUS_LABEL_AR,
  type SupportTicketDetail,
} from '@/services/support';

export default function SupportTicketDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; fresh?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const fresh = Array.isArray(params.fresh) ? params.fresh[0] : params.fresh;
  const { accessToken } = useAuth();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await fetchTicket(String(id));
    setTicket(data);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load, fresh]),
  );

  useSupportTicketSocket(accessToken, ticket?.id ?? (id ? String(id) : null), () => {
    void load();
  });

  const handleReply = async () => {
    if (!ticket || !reply.trim()) return;
    setSending(true);
    const res = await replyToTicket(ticket.id, reply.trim());
    setSending(false);
    if (!res.ok) {
      Alert.alert('تعذر الإرسال', res.error ?? 'حاول مرة أخرى');
      return;
    }
    setReply('');
    void load();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="تفاصيل التذكرة" showBack />
        <ActivityIndicator style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="تفاصيل التذكرة" showBack />
        <Text style={styles.notFound}>التذكرة غير موجودة</Text>
      </SafeAreaView>
    );
  }

  const closed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';
  const humanActive =
    ticket.handlerMode === 'HUMAN_ACTIVE' ||
    ticket.status === 'WAITING_FOR_SUPPORT' ||
    ticket.status === 'IN_PROGRESS';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={ticket.ticketNumber} showBack />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.content, getRtlDirection()]}>
          <GlassCard style={styles.headerCard}>
            <Text style={styles.subject}>{ticket.subject}</Text>
            <Text style={styles.ticketNumber}>رقم البلاغ: {ticket.ticketNumber}</Text>
            <Text style={styles.status}>
              {TICKET_STATUS_LABEL_AR[ticket.status] ?? ticket.status}
            </Text>
            {humanActive ? (
              <Text style={styles.handoff}>
                تم تحويلك إلى خدمة العملاء. سرحان لن يرد تلقائيًا على هذه المحادثة.
              </Text>
            ) : null}
            <Text style={styles.description}>{ticket.description}</Text>
          </GlassCard>

          {(ticket.messages ?? []).map((msg) => (
            <GlassCard
              key={msg.id}
              style={[styles.message, msg.isStaffReply && styles.staffMessage]}
            >
              <Text style={styles.messageAuthor}>
                {messageAuthorLabel(msg)}
              </Text>
              <Text style={styles.messageBody}>{msg.body}</Text>
              <Text style={styles.messageTime}>
                {new Date(msg.createdAt).toLocaleString('ar-SA')}
              </Text>
            </GlassCard>
          ))}

          {!closed ? (
            <View style={styles.replyBox}>
              <AppTextInput
                label="ردك"
                value={reply}
                onChangeText={setReply}
                multiline
                numberOfLines={4}
              />
              <PrimaryButton
                title="إرسال الرد"
                fullWidth
                loading={sending}
                disabled={!reply.trim() || sending}
                onPress={() => void handleReply()}
              />
            </View>
          ) : (
            <Text style={styles.closedHint}>هذه التذكرة مغلقة ولا يمكن إضافة ردود.</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    flex: { flex: 1 },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.huge },
    loader: { marginTop: spacing.xxl },
    notFound: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
    headerCard: { gap: spacing.sm },
    subject: { ...typography.h3, color: colors.textPrimary },
    ticketNumber: { ...typography.caption, color: colors.textBrandStrong },
    status: { ...typography.caption, color: colors.electric },
    handoff: { ...typography.caption, color: colors.warning, lineHeight: 20 },
    description: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
    message: { gap: spacing.xs },
    staffMessage: { borderColor: colors.electric, borderWidth: StyleSheet.hairlineWidth },
    messageAuthor: { ...typography.caption, color: colors.textBrandStrong },
    messageBody: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
    messageTime: { ...typography.micro, color: colors.textMuted },
    replyBox: { gap: spacing.md, marginTop: spacing.md },
    closedHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  });
}
