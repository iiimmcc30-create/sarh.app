import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow, getRtlText } from '@/lib/rtl';
import type { PostComment } from '@/services/types';
import { UserProfileLink } from '@/components/feature/UserProfileLink';
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { VerifiedInlineName } from '@/components/ui/VerifiedInlineName';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { ListingCommentsModal } from '@/components/feature/ListingCommentsModal';
import { fetchListingComments } from '@/components/feature/listingCommentsUtils';

type ListingCommentsSectionProps = {
  listingId: string;
  /** Flat full-width section for listing detail edge-to-edge layout */
  layout?: 'card' | 'edge';
};

export function ListingCommentsSection({
  listingId,
  layout = 'edge',
}: ListingCommentsSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors, layout));
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadComments = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    setLoadError(null);
    const result = await fetchListingComments(listingId);
    setComments(result.comments);
    setLoadError(result.error);
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const openCommentsModal = () => {
    setModalVisible(true);
  };

  return (
    <>
      <View style={layout === 'edge' ? styles.section : styles.card}>
        <RtlTextShell>
          <RtlText style={styles.sectionTitle}>عدد التعليقات ({comments.length})</RtlText>
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
            <RtlText style={styles.empty}>لا توجد تعليقات بعد — كن أول من يعلّق</RtlText>
          </RtlTextShell>
        ) : (
          <View style={styles.list}>
            {comments.map((c, index) => (
              <View
                key={c.id}
                style={[
                  layout === 'edge' ? styles.commentRow : styles.commentCard,
                  layout === 'edge' && index < comments.length - 1 && styles.commentRowDivider,
                ]}
              >
                <View style={[styles.commentCardHeader, getRtlRow()]}>
                  <Text style={styles.commentTime}>{c.createdAt}</Text>
                  <CoverTrailRow justify="flex-end" gap={6} flex style={styles.commentMeta}>
                    <VerifiedInlineName
                      name={c.author.arabicName || c.author.displayName}
                      verified={c.author.verified}
                      badgeSize={12}
                      nameStyle={styles.commentName}
                    />
                    <UserProfileLink userId={c.author.id}>
                      <Image
                        source={uriSource(c.author.avatar)}
                        style={styles.avatar}
                        contentFit="cover"
                      />
                    </UserProfileLink>
                  </CoverTrailRow>
                </View>
                <RtlTextShell>
                  <RtlText style={styles.commentText}>{c.content}</RtlText>
                </RtlTextShell>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={openCommentsModal}
          style={[styles.addCommentTrigger, getRtlRow()]}
        >
          <View style={[styles.addCommentInput, getRtlRow()]}>
            <RtlTextShell flex>
              <RtlText style={styles.addCommentPlaceholder}>أكتب تعليقك هنا...</RtlText>
            </RtlTextShell>
            <AppIcon name="send" size={18} color={colors.textSubtle} />
          </View>
        </Pressable>
      </View>

      <ListingCommentsModal
        visible={modalVisible}
        listingId={listingId}
        onClose={() => setModalVisible(false)}
        onCommentAdded={() => void loadComments()}
      />
    </>
  );
}

function createStyles(colors: ThemeColors, layout: 'card' | 'edge') {
  const isEdge = layout === 'edge';
  return StyleSheet.create({
    section: {
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderHairline,
      backgroundColor: colors.screenRoot,
    },
    card: {
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    sectionTitle: {
      ...typography.feedTitle,
      color: colors.textPrimary,
      ...getRtlText(),
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
      ...getRtlText(),
    },
    list: {
      gap: isEdge ? 0 : spacing.sm,
    },
    commentRow: {
      gap: spacing.xs,
      paddingVertical: spacing.md,
    },
    commentRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    commentCard: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    commentCardHeader: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    commentMeta: {
      minWidth: 0,
    },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: colors.bgSurface,
    },
    commentName: {
      ...typography.micro,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    commentTime: {
      ...typography.micro,
      color: colors.textMuted,
      flexShrink: 0,
    },
    commentText: {
      ...typography.feedBody,
      color: colors.textSecondary,
      lineHeight: 22,
      ...getRtlText(),
    },
    addCommentTrigger: {
      width: '100%',
      ...(isEdge
        ? {
            marginTop: spacing.xs,
            paddingTop: spacing.md,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.borderHairline,
          }
        : null),
    },
    addCommentInput: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 48,
      paddingHorizontal: spacing.md,
      borderRadius: isEdge ? radius.md : radius.lg,
      borderWidth: isEdge ? 0 : 1,
      borderColor: colors.borderSoft,
      backgroundColor: isEdge ? colors.bgElevated : colors.bgElevated,
    },
    addCommentPlaceholder: {
      ...typography.feedBody,
      color: colors.textSubtle,
      ...getRtlText(),
    },
  });
}
