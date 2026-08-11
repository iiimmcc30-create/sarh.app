import { AppIcon } from '@/components/ui/FlaticonIcon';
import { sarh } from '@/constants/sarhTokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { rtlForwardIcon, getRtlRow } from '@/lib/rtl';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
};

/** Unified section title + optional "see all" action for home and feed sections. */
export function SectionHeader({
  title,
  subtitle,
  onSeeAll,
  seeAllLabel = 'عرض الكل',
}: SectionHeaderProps) {
  const { scheme } = useTheme();
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors, theme.scheme),
    colors: theme.colors,
  }));
  const isDark = scheme === 'dark';

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, getRtlRow()]}>
        <View style={[styles.titleBlock, getRtlRow()]}>
          {isDark ? <View style={styles.accentMark} /> : null}
          <View style={styles.titleTextWrap}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8} style={[styles.seeAll, getRtlRow()]}>
            <Text style={styles.seeAllText}>{seeAllLabel}</Text>
            <AppIcon
              name={rtlForwardIcon()}
              size={14}
              color={isDark ? colors.textSecondary : colors.textBrandStrong}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const isDark = scheme === 'dark';
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      paddingTop: isDark ? spacing.xl : spacing.lg,
      paddingBottom: isDark ? spacing.md : spacing.sm,
    },
    row: {
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 32,
    },
    titleBlock: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.sm,
    },
    titleTextWrap: {
      flex: 1,
      gap: spacing.xs,
    },
    accentMark: {
      width: 3,
      height: 22,
      borderRadius: 2,
      backgroundColor: sarh.color.action,
    },
    title: {
      ...typography.h3,
      fontSize: isDark ? 20 : 18,
      lineHeight: isDark ? 28 : 24,
      fontWeight: isDark ? '700' : '700',
      color: isDark ? colors.textPrimary : colors.electric,
      writingDirection: 'rtl', textAlign: 'right' as const,
    },
    subtitle: {
      ...typography.caption,
      lineHeight: 18,
      color: colors.textMuted,
    },
    seeAll: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
    },
    seeAllText: {
      ...typography.caption,
      lineHeight: 18,
      fontWeight: '500',
      color: isDark ? colors.textSecondary : colors.textBrandStrong,
    },
  });
}

export default SectionHeader;
