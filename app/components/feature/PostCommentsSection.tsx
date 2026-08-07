import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { useCallback, useEffect, useImperativeHandle, useState, forwardRef } from 'react';
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
import { deletePostComment } from '@/services/comments';
import { alertMessage, confirmDestructive } from '@/lib/actionSheet';
import { canDeleteComment } from '@/lib/currentUser';
import { showToast } from '@/lib/toast';
import { useApp } from '@/hooks/useApp';
import { rtlRow } from '@/lib/rtl';
import { UserProfileLink } from '@/components/feature/UserProfileLink';
import type { PostComment } from '@/services/types';

type PostCommentsSectionProps = {
  postId: string;
  postOwnerId?: string;
  showInput?: boolean;
  onCommentAdded?: () => void;
  onSubmitComment?: (content: string) => Promise<boolean>;
};

export type PostCommentsSectionRef = {
  reload: () => Promise<void>;
  focusInput: () => void;
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

export const PostCommentsSection = forwardRef<PostCommentsSectionRef, PostCommentsSectionProps>(
  function PostCommentsSection({ postId, postOwnerId, showInput = true, onCommentAdded, onSubmitComment }, ref) {
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
    const [inputRef, setInputRef] = useState<TextInput | null>(null);

    const handleDelete = async (commentId: string) => {
      const confirmed = await confirmDestructive(
        'حذف التعليق',
        'هل تريد حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء.',
        'حذف التعليق',
      );
      if (!confirmed) return;

      setDeletingId(commentId);
      const result = await deletePostComment(postId, commentId);
      setDeletingId(null);
      if (!result.ok) {
        await alertMessage('تعذر حذف التعليق', result.message, 'close-circle-outline');
        return;
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentAdded?.();
      void showToast('تم حذف التعليق');
    };

    const loadComments = useCallback(async () => {
      if (!postId) return;
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`);
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          const rows = Array.isArray(json.data?.comments) ? json.data.comments : [];
          setComments(rows.map(mapComment));
          return;
        }
        setComments([]);
        setLoadError(json.messageAr ?? json.message ?? 'تعذّر تحميل التعليقات');
      } catch (err) {
        console.warn('[PostComments] load failed:', err);
        setComments([]);
        setLoadError('تعذّر تحميل التعليقات — تحقق من الاتصال');
      } finally {
        setLoading(false);
      }
    }, [postId]);

    useEffect(() => {
      void loadComments();
    }, [loadComments]);

    useImperativeHandle(ref, () => ({
      reload: loadComments,
      focusInput: () => inputRef?.focus(),
    }), [loadComments, inputRef]);

    const handleSend = async () => {
      if (!isAuthenticated) {
        await alertMessage('تسجيل الدخول', 'يجب تسجيل الدخول لإضافة تعليق', 'log-in-outline');
        return;
      }
      if (!text.trim() || sending) return;

      setSending(true);
      try {
        const ok = onSubmitComment
          ? await onSubmitComment(text.trim())
          : await (async () => {
              const res = await authFetch(`${API_BASE}/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text.trim() }),
              });
              const json = await res.json().catch(() => ({}));
              return res.ok && json.success;
            })();
        if (ok) {
          setText('');
          await loadComments();
          onCommentAdded?.();
          void showToast('تم إرسال التعليق');
        } else {
          await alertMessage('تعذّر الإرسال', 'حاول مرة أخرى', 'alert-circle-outline');
        }
      } catch {
        await alertMessage('خطأ', 'تعذّر إرسال التعليق', 'close-circle-outline');
      } finally {
        setSending(false);
      }
    };

    return (
      <View style={styles.wrap}>
        <View style={[styles.header, rtlRow]}>
          <View style={styles.sectionBar} />
          <Text style={styles.title}>التعليقات</Text>
          <Text style={styles.count}>{comments.length}</Text>
        </View>

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
          <Text style={styles.empty}>لا توجد تعليقات بعد — كن أول من يعلّق</Text>
        ) : (
          <View style={styles.list}>
            {comments.map((c) => (
              <View key={c.id} style={[styles.commentRow, rtlRow]}>
                <UserProfileLink userId={c.author.id}>
                  <Image source={uriSource(c.author.avatar)} style={styles.avatar} contentFit="cover" />
                </UserProfileLink>
                <View style={styles.commentBubble}>
                  <View style={[styles.commentHeader, rtlRow]}>
                    <UserProfileLink userId={c.author.id} style={[styles.commentMeta, rtlRow]}>
                      <Text style={styles.commentName}>{c.author.arabicName || c.author.displayName}</Text>
                      {c.author.verified ? (
                        <AppIcon name="checkmark-circle" size={12} color={colors.electricBright} />
                      ) : null}
                      <Text style={styles.commentTime}>{c.createdAt}</Text>
                    </UserProfileLink>
                    {canDeleteComment(c.author.id, postOwnerId, user, me) ? (
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
                  <Text style={styles.commentText}>{c.content}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {showInput ? (
          <View style={[styles.inputRow, rtlRow]}>
            <TextInput
              ref={setInputRef}
              style={styles.input}
              placeholder={isAuthenticated ? 'اكتب تعليقاً...' : 'سجّل الدخول للتعليق'}
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
        ) : null}
      </View>
    );
  },
);

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderHairline,
    },
    header: {
      alignItems: 'center',
      gap: 8,
    },
    sectionBar: {
      width: 4,
      height: 16,
      borderRadius: 2,
      backgroundColor: colors.electricBright,
    },
    title: {
      ...typography.bodyStrong,
      color: colors.textBrandStrong,
      fontWeight: '700',
      flex: 1,
      textAlign: 'right',
    },
    count: {
      ...typography.caption,
      color: colors.textMuted,
      backgroundColor: colors.bgElevated,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    loader: {
      paddingVertical: spacing.lg,
    },
    empty: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      paddingVertical: spacing.sm,
    },
    errorBox: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    errorText: {
      ...typography.body,
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
      ...typography.caption,
      color: colors.electricBright,
      fontWeight: '600',
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
      alignItems: 'center',
      gap: 4,
      flex: 1,
      flexWrap: 'wrap',
    },
    commentName: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    commentTime: {
      ...typography.micro,
      color: colors.textMuted,
    },
    commentText: {
      ...typography.body,
      color: colors.textSecondary,
      ...rtlTextAlign(),
      ...getRtlText(),
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
      ...typography.body,
      color: colors.textPrimary,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: {
      opacity: 0.45,
    },
  });
}
