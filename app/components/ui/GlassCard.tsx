import { ds } from '@/constants/designSystem';
import { sarh } from '@/constants/sarhTokens';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  glow?: boolean;
  elevated?: boolean;
  padding?: number;
}

/** Premium flat card surface — Sarh 2026 */
export function GlassCard({
  children,
  style,
  elevated = false,
  padding = ds.space.md,
}: GlassCardProps) {
  const { styles } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors, theme.scheme),
  }));

  return (
    <View style={[styles.wrap, elevated && styles.elevated, style]}>
      <View style={[styles.card, { padding }]}>{children}</View>
    </View>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const isDark = scheme === 'dark';
  return StyleSheet.create({
    wrap: {
      borderRadius: sarh.radius.card,
    },
    card: {
      borderRadius: sarh.radius.card,
      backgroundColor: isDark ? sarh.color.surface : colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? sarh.color.border : colors.borderSoft,
      overflow: 'hidden',
    },
    elevated: {
      backgroundColor: isDark ? sarh.color.surfaceRaised : colors.bgElevated,
    },
  });
}

export default GlassCard;
