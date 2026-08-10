import { ds } from '@/constants/designSystem';
import { appChrome, shadow, type ThemeColors } from '@/constants/theme';
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
    styles: createStyles(theme.colors),
  }));

  return (
    <View style={[styles.wrap, elevated && styles.elevated, style]}>
      <View style={[styles.card, { padding }]}>{children}</View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      borderRadius: appChrome.cardRadius,
      ...shadow.card,
    },
    card: {
      borderRadius: appChrome.cardRadius,
      backgroundColor: colors.bgGlassStrong,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
    },
    elevated: {
      backgroundColor: colors.bgElevated,
    },
  });
}

export default GlassCard;
