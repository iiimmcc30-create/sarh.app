import { AppIcon } from '@/components/ui/FlaticonIcon';
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
      <View style={styles.coverTrail}>
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
        <View style={styles.rtlTextShell}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
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
    coverTrail: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 32,
      gap: spacing.sm,
    },
    rtlTextShell: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
    },
    title: {
      ...typography.h3,
      fontSize: isDark ? 20 : 18,
      lineHeight: isDark ? 28 : 24,
      fontWeight: '700',
      color: isDark ? colors.textPrimary : colors.electric,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    subtitle: {
      ...typography.caption,
      lineHeight: 18,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
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
