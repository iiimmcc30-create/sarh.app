import { AppIcon } from '@/components/ui/FlaticonIcon';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlDirection, getRtlRow } from '@/lib/rtl';
import type { PromotionGoal } from '@/services/listingPromote';
import { ListingBoostTitleIcons } from '@/components/listing/ListingBoostTitleIcons';
import { StyleSheet, Text, View } from 'react-native';

type PromoteGoalPreviewProps = {
  goal: PromotionGoal | null;
  title?: string;
  compact?: boolean;
};

/** معاينة شكل الإعلان حسب الهدف — الترويج لا يغيّر الشكل، فقط قوة الظهور */
export function PromoteGoalPreview({ goal, title = 'عنوان إعلانك', compact = false }: PromoteGoalPreviewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  const previewPinned = goal === 'pinned';
  const previewFeatured = goal === 'featured';
  const isVisibility = goal === 'visibility';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, getRtlDirection()]}>
      <View style={styles.rtlTextShell}>
        <Text style={styles.label}>معاينة الشكل في السوق</Text>
      </View>

      <View style={[styles.mockCard, getRtlDirection()]}>
        <View style={[styles.mockTitleRow, getRtlRow()]}>
          <ListingBoostTitleIcons
            pinned={previewPinned}
            featured={previewFeatured}
            size="sm"
          />
          <View style={styles.mockTitleShell}>
            <Text style={styles.mockTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>
        <View style={[styles.mockMeta, getRtlRow()]}>
          <View style={styles.mockThumb} />
          <View style={styles.mockLines}>
            <View style={styles.mockLineShort} />
            <View style={styles.mockLineLong} />
          </View>
        </View>
      </View>

      {isVisibility ? (
        <View style={styles.reachBlock}>
          <View style={[styles.reachHeader, getRtlRow()]}>
            <AppIcon name="trending-up-outline" size={16} color="#7C3AED" />
            <View style={styles.inlineTextShell}>
              <Text style={styles.reachTitle}>زيادة قوة الظهور</Text>
            </View>
          </View>
          <View style={styles.rtlTextShell}>
            <Text style={styles.reachDesc}>
              لا يتغيّر شكل إعلانك — يُعرض لجمهور أوسع ويحصل على أولوية في الخوارزمية
            </Text>
          </View>
          <View style={styles.reachBars}>
            <View style={[styles.reachBar, styles.reachBarDim]} />
            <View style={[styles.reachBar, styles.reachBarMid]} />
            <View style={[styles.reachBar, styles.reachBarFull]} />
          </View>
        </View>
      ) : previewPinned ? (
        <View style={[styles.hintRow, getRtlRow()]}>
          <AppIcon name="pin" size={12} color={colors.electric} />
          <View style={styles.inlineTextShell}>
            <Text style={styles.hint}>يظهر دبوس صغير بجانب العنوان ويبقى في أعلى القائمة</Text>
          </View>
        </View>
      ) : previewFeatured ? (
        <View style={[styles.hintRow, getRtlRow()]}>
          <AppIcon name="star" size={12} color={colors.gold} />
          <View style={styles.inlineTextShell}>
            <Text style={styles.hint}>تظهر نجمة ذهبية بجانب العنوان في نتائج البحث</Text>
          </View>
        </View>
      ) : (
        <View style={styles.rtlTextShell}>
          <Text style={styles.hintMuted}>اختر هدفاً لمعاينة تأثيره على شكل الإعلان</Text>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: colors.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    wrapCompact: {
      padding: spacing.sm,
    },
    /** Physical LTR shell — same as listing title / SidebarMenuItem. */
    rtlTextShell: {
      width: '100%',
      direction: 'ltr',
    },
    inlineTextShell: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
    },
    label: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    mockCard: {
      padding: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: colors.bgSurface,
      gap: spacing.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderHairline,
    },
    mockTitleRow: {
      alignItems: 'center',
      gap: 6,
    },
    mockTitleShell: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
    },
    mockTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
      fontSize: 14,
    },
    mockMeta: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    mockThumb: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.bgDeep,
    },
    mockLines: {
      flex: 1,
      gap: 6,
    },
    mockLineShort: {
      height: 8,
      width: '45%',
      borderRadius: 4,
      backgroundColor: colors.borderSoft,
      alignSelf: 'flex-end',
    },
    mockLineLong: {
      height: 8,
      width: '75%',
      borderRadius: 4,
      backgroundColor: colors.borderHairline,
      alignSelf: 'flex-end',
    },
    reachBlock: {
      gap: spacing.xs,
    },
    reachHeader: {
      alignItems: 'center',
      gap: 6,
    },
    reachTitle: {
      ...typography.caption,
      color: '#7C3AED',
      fontWeight: '600',
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    reachDesc: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 18,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    reachBars: {
      ...getRtlRow(),
      alignItems: 'flex-end',
      gap: 6,
      marginTop: spacing.xs,
      height: 36,
    },
    reachBar: {
      flex: 1,
      borderRadius: 4,
      backgroundColor: '#7C3AED',
    },
    reachBarDim: {
      height: '40%',
      opacity: 0.35,
    },
    reachBarMid: {
      height: '68%',
      opacity: 0.65,
    },
    reachBarFull: {
      height: '100%',
    },
    hintRow: {
      alignItems: 'center',
      gap: 6,
    },
    hint: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: 18,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    hintMuted: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
  });
}
