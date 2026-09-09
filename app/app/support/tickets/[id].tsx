import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppText, SarhAvatar, SarhButton, SarhDivider, SarhSurface, SarhInput } from '@/design-system/components';
import { showToast } from '@/lib/toast';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useSupportTicketSocket } from '@/hooks/useSupportTicketSocket';
import { useAuth } from '@/contexts/AuthContext';
import { spacing, type ThemeColors } from '@/constants/theme';
import { getRtlRow } from '@/lib/rtl';
import { messageAuthorLabel } from '@/lib/supportRealtime';
import { SUPPORT_CUSTOMER_SERVICE } from '@/constants/supportIdentity';
import { userFacingTicketStatus } from '@/lib/supportFlow';
import {
  fetchTicket,
  replyToTicket,
  type SupportTicketDetail,
  type SupportTicketMessage,
} from '@/services/support';

function isSystemHandoff(msg: SupportTicketMessage) {
  return (
    msg.authorKind === 'SARHAN' &&
    (msg.body.includes('تم تحويل طلبك') || msg.body.includes('الفريق المختص'))
  );
}

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
      void showToast(res.error ?? 'حاول مرة أخرى', 'error');
      return;
    }
    setReply('');
    void load();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title={SUPPORT_CUSTOMER_SERVICE.name} showBack />
        <ActivityIndicator style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title={SUPPORT_CUSTOMER_SERVICE.name} showBack />
        <AppText variant="body" color="textMuted" align="center" style={styles.notFound}>
          المحادثة غير موجودة
        </AppText>
      </SafeAreaView>
    );
  }

  const closed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={SUPPORT_CUSTOMER_SERVICE.name} showBack />
      <View style={[styles.identity, getRtlRow()]}>
        <SarhAvatar
          source={SUPPORT_CUSTOMER_SERVICE.avatarSource}
          name={SUPPORT_CUSTOMER_SERVICE.assistantName}
          size="md"
          accessibilityLabel={SUPPORT_CUSTOMER_SERVICE.assistantName}
        />
        <View style={styles.identityCopy}>
          <AppText variant="label">{SUPPORT_CUSTOMER_SERVICE.name}</AppText>
          <AppText variant="caption" color="textMuted">
            {SUPPORT_CUSTOMER_SERVICE.assistantName} · {userFacingTicketStatus(ticket.status)}
          </AppText>
        </View>
      </View>
      <SarhDivider />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {(ticket.messages ?? []).map((msg) => {
            const mine = msg.authorKind === 'CUSTOMER' && !msg.isStaffReply;
            const system = isSystemHandoff(msg);
            return (
              <View
                key={msg.id}
                style={[
                  styles.bubbleWrap,
                  mine ? styles.bubbleMineWrap : styles.bubbleOtherWrap,
                ]}
              >
                {system ? (
                  <SarhSurface tone="surfaceAlt" style={styles.systemBubble}>
                    <AppText variant="caption" color="textSecondary">
                      {msg.body}
                    </AppText>
                  </SarhSurface>
                ) : (
                  <View
                    style={[
                      styles.msgRow,
                      getRtlRow(),
                      mine ? styles.msgRowMine : styles.msgRowOther,
                    ]}
                  >
                    {!mine ? (
                      <SarhAvatar
                        source={
                          msg.authorKind === 'SARHAN'
                            ? SUPPORT_CUSTOMER_SERVICE.avatarSource
                            : undefined
                        }
                        name={messageAuthorLabel(msg)}
                        size="sm"
                        accessibilityLabel={messageAuthorLabel(msg)}
                      />
                    ) : null}
                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                      {!mine ? (
                        <AppText variant="micro" color="textMuted">
                          {messageAuthorLabel(msg)}
                        </AppText>
                      ) : null}
                      <AppText variant="body">{msg.body}</AppText>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          {!closed ? (
            <View style={styles.replyBox}>
              <SarhInput appearance="theme"
                label="اكتب رسالة"
                value={reply}
                onChangeText={setReply}
                multiline
                numberOfLines={3}
              />
              <SarhButton
                title="إرسال"
                fullWidth
                loading={sending}
                disabled={!reply.trim() || sending}
                onPress={() => void handleReply()}
              />
            </View>
          ) : (
            <AppText variant="caption" color="textMuted" align="center">
              هذه المحادثة مغلقة.
            </AppText>
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
    loader: { marginTop: spacing.xxl },
    notFound: { marginTop: spacing.xxl },
    identity: {
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    identityCopy: { flex: 1, gap: 2 },
    content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.huge },
    bubbleWrap: { width: '100%' },
    bubbleMineWrap: { alignItems: 'flex-start' },
    bubbleOtherWrap: { alignItems: 'flex-end' },
    msgRow: {
      alignItems: 'flex-end',
      gap: spacing.sm,
      maxWidth: '100%',
    },
    msgRowMine: { justifyContent: 'flex-start' },
    msgRowOther: { justifyContent: 'flex-start' },
    bubble: {
      maxWidth: '86%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 16,
      gap: 4,
    },
    bubbleMine: {
      backgroundColor: colors.bgElevated,
    },
    bubbleOther: {
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderHairline,
    },
    systemBubble: {
      width: '100%',
      padding: spacing.md,
      borderRadius: 12,
    },
    replyBox: { gap: spacing.md, marginTop: spacing.md },
  });
}
