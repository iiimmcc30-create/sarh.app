import { AppIcon } from '@/components/ui/FlaticonIcon';
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { rtlForwardIcon } from '@/lib/rtl';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
};

/** Section title — cover-style RTL: title on physical right, see-all on physical left. */
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
      <CoverTrailRow justify="space-between" gap={spacing.sm} style={styles.coverTrail}>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
            <AppIcon
              name={rtlForwardIcon()}
              size={14}
              color={isDark ? colors.textSecondary : colors.textBrandStrong}
            />
            <Text style={styles.seeAllText}>{seeAllLabel}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <RtlTextShell flex>
          <RtlText style={styles.title}>{title}</RtlText>
          {subtitle ? <RtlText style={styles.subtitle}>{subtitle}</RtlText> : null}
        </RtlTextShell>
      </CoverTrailRow>
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
    coverTrail: {
      minHeight: 32,
    },
    title: {
      ...typography.h3,
      fontSize: isDark ? 20 : 18,
      lineHeight: isDark ? 28 : 24,
      fontWeight: '700',
      color: isDark ? colors.textPrimary : colors.electric,
    },
    subtitle: {
      ...typography.caption,
      lineHeight: 18,
      color: colors.textMuted,
    },
    seeAll: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      flexShrink: 0,
    },
    seeAllText: {
      ...typography.caption,
      lineHeight: 18,
      fontWeight: '500',
      color: isDark ? colors.textSecondary : colors.textBrandStrong,
      writingDirection: 'rtl',
    },
  });
}

export default SectionHeader;
