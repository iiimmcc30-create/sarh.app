import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ds } from '@/constants/designSystem';
import { sarh } from '@/constants/sarhTokens';
import { controls, motion, radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow, getRtlText } from '@/lib/rtl';

interface PrimaryButtonProps {
  title: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'ghost' | 'gold' | 'outline';
  small?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

export function PrimaryButton({
  title,
  onPress,
  style,
  variant = 'primary',
  small,
  disabled,
  loading = false,
  icon,
  fullWidth = false,
}: PrimaryButtonProps) {
  const { scheme } = useTheme();
  const isDark = scheme === 'dark';
  const { styles, colors, gradients } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors, theme.scheme),
    colors: theme.colors,
    gradients: theme.gradients,
  }));

  const blocked = disabled || loading;
  const contentColor =
    variant === 'gold'
      ? '#1A1300'
      : variant === 'outline' || variant === 'ghost'
        ? colors.textPrimary
        : '#FFFFFF';

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : icon ? (
        <AppIcon name={icon} size={small ? 16 : 18} color={contentColor} />
      ) : null}
      <Text style={[styles.label, { color: contentColor }]}>{title}</Text>
    </View>
  );

  if (variant === 'ghost' || variant === 'outline') {
    const isOutline = variant === 'outline';
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: blocked, busy: loading }}
        onPress={blocked ? undefined : onPress}
        style={({ pressed }) => [
          isOutline ? styles.outline : styles.ghost,
          small && styles.small,
          fullWidth && styles.fullWidth,
          pressed && styles.pressed,
          blocked && styles.disabled,
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  if (variant === 'gold') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: blocked, busy: loading }}
        onPress={blocked ? undefined : onPress}
        style={({ pressed }) => [
          styles.shell,
          fullWidth && styles.fullWidth,
          pressed && styles.pressed,
          blocked && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={gradients.goldRing}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btn, small && styles.small, fullWidth && styles.fullWidth]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      onPress={blocked ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        styles.primary,
        isDark && styles.primaryDark,
        small && styles.small,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        blocked && styles.disabled,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const isDark = scheme === 'dark';
  return StyleSheet.create({
    shell: {
      borderRadius: sarh.radius.md,
    },
    btn: {
      paddingHorizontal: spacing.xl,
      borderRadius: sarh.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: controls.heightLg,
      overflow: 'hidden',
    },
    primary: {
      backgroundColor: isDark ? sarh.color.action : colors.electric,
    },
    primaryDark: {
      // pressed state handled via opacity transform
    },
    ghost: {
      paddingHorizontal: spacing.xl,
      minHeight: controls.heightLg,
      borderRadius: sarh.radius.md,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outline: {
      paddingHorizontal: spacing.xl,
      minHeight: controls.heightLg,
      borderRadius: sarh.radius.md,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    small: {
      paddingHorizontal: spacing.lg,
      minHeight: controls.heightSm,
      borderRadius: radius.md,
    },
    fullWidth: { width: '100%' },
    pressed: {
      transform: [{ scale: motion.pressScale }],
      opacity: 0.88,
      backgroundColor: isDark ? sarh.color.actionPressed : undefined,
    },
    disabled: { opacity: 0.45 },
    content: {
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    label: {
      ...typography.bodyStrong,
      ...getRtlText(),
      textAlign: 'center',
    },
  });
}

export default PrimaryButton;
