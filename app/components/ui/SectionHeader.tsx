import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { rtlForwardIcon, rtlRow } from '@/lib/rtl';

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
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, rtlRow]}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8} style={[styles.seeAll, rtlRow]}>
            <Text style={styles.seeAllText}>{seeAllLabel}</Text>
            <AppIcon name={rtlForwardIcon()} size={14} color={colors.textBrandStrong} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    row: {
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 32,
    },
    titleBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.h3,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '700',
      color: colors.electric,
      writingDirection: 'rtl',
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
      fontWeight: '600',
      color: colors.textBrandStrong,
    },
  });
}
