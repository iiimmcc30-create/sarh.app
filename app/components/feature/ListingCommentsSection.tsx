import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';
import { formatRelativeTimeAr } from '@/lib/formatRelativeTime';
import { deleteListingComment } from '@/services/comments';
import { alertMessage, confirmDestructive } from '@/lib/actionSheet';
import { canDeleteComment } from '@/lib/currentUser';
import { showToast } from '@/lib/toast';
import { useApp } from '@/hooks/useApp';
import { getRtlRow } from '@/lib/rtl';
import { UserProfileLink } from '@/components/feature/UserProfileLink';
import type { PostComment } from '@/services/types';
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { VerifiedInlineName } from '@/components/ui/VerifiedInlineName';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

type ListingCommentsSectionProps = {
  listingId: string;
  listingOwnerId?: string;
};

function mapComment(c: {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    arabicName: string;
    avatar?: string | null;
    verified?: boolean;
  };
}): PostComment {
  return {
    id: c.id,
    content: c.content,
    createdAt: formatRelativeTimeAr(c.createdAt) || new Date(c.createdAt).toLocaleString('ar-SA'),
    author: {
      id: c.author.id,
      username: c.author.username,
      displayName: c.author.displayName || '',
      arabicName: c.author.arabicName || '',
      avatar: c.author.avatar ?? undefined,
      verified: c.author.verified ?? false,
      followers: 0,
      following: 0,
      rating: null,
      country: 'SA',
      bio: '',
    },
  };
}

export function ListingCommentsSection({ listingId, listingOwnerId }: ListingCommentsSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const { isAuthenticated, user } = useAuth();
  const { me } = useApp();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (commentId: string) => {
    const confirmed = await confirmDestructive(
      'حذف التعليق',
      'هل تريد حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء.',
      'حذف التعليق',
    );
    if (!confirmed) return;

    setDeletingId(commentId);
    const result = await deleteListingComment(listingId, commentId);
    setDeletingId(null);
    if (!result.ok) {
      await alertMessage('تعذر حذف التعليق', result.message, 'close-circle-outline');
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    void showToast('تم حذف التعليق');
  };

  const loadComments = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_BASE}/api/listings/${listingId}/comments`);
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        const rows = Array.isArray(json.data?.comments) ? json.data.comments : [];
        setComments(rows.map(mapComment));
        return;
      }
      setComments([]);
      setLoadError(json.messageAr ?? json.message ?? 'تعذّر تحميل الردود');
    } catch (err) {
      console.warn('[ListingComments] load failed:', err);
      setComments([]);
      setLoadError('تعذّر تحميل الردود — تحقق من الاتصال');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const handleSend = async () => {
    if (!isAuthenticated) {
      await alertMessage('تسجيل الدخول', 'يجب تسجيل الدخول لإضافة رد على الإعلان', 'log-in-outline');
      return;
    }
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const res = await authFetch(`${API_BASE}/api/listings/${listingId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setText('');
        await loadComments();
        void showToast('تم إرسال الرد');
      } else {
        await alertMessage('تعذّر الإرسال', json.messageAr ?? json.message ?? 'حاول مرة أخرى', 'alert-circle-outline');
      }
    } catch {
      await alertMessage('خطأ', 'تعذّر إرسال الرد', 'close-circle-outline');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.card}>
      <CoverTrailRow justify="space-between" gap={8} style={styles.header}>
        <Text style={styles.count}>{comments.length}</Text>
        <CoverTrailRow justify="flex-end" gap={8} flex style={styles.headerTrail}>
          <RtlTextShell flex>
            <RtlText style={styles.title}>الردود على الإعلان</RtlText>
          </RtlTextShell>
          <View style={styles.sectionBar} />
        </CoverTrailRow>
      </CoverTrailRow>

      <RtlTextShell>
        <RtlText style={styles.hint}>
          ردود عامة يراها الجميع — للمحادثة الخاصة استخدم زر المراسلة أسفل الصفحة
        </RtlText>
      </RtlTextShell>

      {loading ? (
        <ActivityIndicator color={colors.electricBright} style={styles.loader} />
      ) : loadError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable onPress={() => void loadComments()} style={styles.retryBtn}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      ) : comments.length === 0 ? (
        <RtlTextShell>
          <RtlText style={styles.empty}>لا توجد ردود بعد — كن أول من يسأل أو يعلّق علناً</RtlText>
        </RtlTextShell>
      ) : (
        <View style={styles.list}>
          {comments.map((c) => (
            <View key={c.id} style={[styles.commentRow, getRtlRow()]}>
              <UserProfileLink userId={c.author.id}>
                <Image source={uriSource(c.author.avatar)} style={styles.avatar} contentFit="cover" />
              </UserProfileLink>
              <View style={styles.commentBubble}>
                <View style={[styles.commentHeader, getRtlRow()]}>
                  <UserProfileLink userId={c.author.id} style={styles.commentMeta}>
                    <CoverTrailRow justify="flex-end" gap={4} style={styles.nameTimeRow}>
                      <Text style={styles.commentTime} numberOfLines={1}>
                        {c.createdAt}
                      </Text>
                      <Text style={styles.metaDot}>·</Text>
                      <VerifiedInlineName
                        name={c.author.arabicName || c.author.displayName}
                        verified={c.author.verified}
                        badgeSize={14}
                        nameStyle={styles.commentName}
                      />
                    </CoverTrailRow>
                  </UserProfileLink>
                  {canDeleteComment(c.author.id, listingOwnerId, user, me) ? (
                    <Pressable
                      onPress={() => void handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      hitSlop={8}
                      style={styles.deleteBtn}
                    >
                      {deletingId === c.id ? (
                        <ActivityIndicator size="small" color={colors.textMuted} />
                      ) : (
                        <AppIcon name="trash-outline" size={15} color={colors.textMuted} />
                      )}
                    </Pressable>
                  ) : null}
                </View>
                <RtlTextShell>
                  <RtlText style={styles.commentText}>{c.content}</RtlText>
                </RtlTextShell>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.inputRow, getRtlRow()]}>
        <TextInput
          style={styles.input}
          placeholder={isAuthenticated ? 'اكتب رداً عاماً على الإعلان...' : 'سجّل الدخول لإضافة رد'}
          placeholderTextColor={colors.textSubtle}
          value={text}
          onChangeText={setText}
          editable={isAuthenticated && !sending && !loadError}
          textAlign="right"
          multiline
          maxLength={500}
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || sending || !isAuthenticated || !!loadError) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending || !isAuthenticated || !!loadError}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <AppIcon name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    header: {
      width: '100%',
    },
    headerTrail: {
      minWidth: 0,
    },
    sectionBar: {
      width: 4,
      height: 16,
      borderRadius: 2,
      backgroundColor: colors.electricBright,
    },
    /** Accent bar sits on physical right beside the section title. */
    title: {
      ...typography.feedTitle,
      color: colors.textBrandStrong,
    },
    count: {
      ...typography.feedBody,
      color: colors.textMuted,
      backgroundColor: colors.bgElevated,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    hint: {
      ...typography.feedBody,
      color: colors.textMuted,
      lineHeight: 20,
    },
    errorBox: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    errorText: {
      ...typography.feedBody,
      color: colors.rose,
      textAlign: 'center',
      lineHeight: 22,
    },
    retryBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    retryText: {
      ...typography.feedTitle,
      color: colors.electricBright,
    },
    loader: {
      paddingVertical: spacing.lg,
    },
    empty: {
      ...typography.feedBody,
      color: colors.textMuted,
      lineHeight: 22,
      paddingVertical: spacing.sm,
    },
    list: {
      gap: spacing.md,
    },
    commentRow: {
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.bgElevated,
    },
    commentBubble: {
      flex: 1,
      minWidth: 0,
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: colors.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    commentHeader: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    commentMeta: {
      flex: 1,
      minWidth: 0,
    },
    nameTimeRow: {
      width: '100%',
      minWidth: 0,
    },
    commentName: {
      ...typography.feedTitle,
      color: colors.textPrimary,
    },
    metaDot: {
      ...typography.feedBody,
      color: colors.textSubtle,
      flexShrink: 0,
    },
    commentTime: {
      ...typography.feedBody,
      color: colors.textMuted,
      flexShrink: 0,
    },
    commentText: {
      ...typography.feedBody,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    deleteBtn: {
      padding: 2,
      borderRadius: radius.pill,
    },
    inputRow: {
      alignItems: 'flex-end',
      gap: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderHairline,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 100,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      ...typography.feedBody,
      color: colors.textPrimary,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 20,
      backgroundColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      opacity: 0.45,
    },
  });
}
