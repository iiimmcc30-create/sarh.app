// SAFAT — Premium glass-lite card surface
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { ambientShadow, ds } from '@/constants/designSystem';
import { radius, type ThemeColors } from '@/constants/theme';
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

export function GlassCard({
  children,
  style,
  glow = false,
  elevated = false,
  padding = ds.space.md,
}: GlassCardProps) {
  const { styles, gradients, scheme } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors, theme.scheme),
    gradients: theme.gradients,
    scheme: theme.scheme,
  }));

  return (
    <View
      style={[
        styles.wrap,
        elevated && ambientShadow(scheme, 'card'),
        glow && ambientShadow(scheme, 'fab'),
        style,
      ]}
    >
      <LinearGradient
        colors={glow ? gradients.cardHover : gradients.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.card}
      >
        <LinearGradient
          colors={gradients.rim}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rim}
        />
        <View style={[styles.inner, { padding }]}>{children}</View>
      </LinearGradient>
    </View>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const tokens = scheme === 'light' ? ds.light : ds.dark;
  return StyleSheet.create({
    wrap: {
      borderRadius: ds.radius.xl,
    },
    card: {
      borderRadius: ds.radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.stroke,
      overflow: 'hidden',
      position: 'relative',
    },
    rim: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1,
    },
    inner: {
      padding: ds.space.md,
    },
  });
}

export default GlassCard;
