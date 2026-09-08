import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { getRtlRow } from '@/lib/rtl';
import { motion, radius, space, typography } from '../tokens';
import { AppText } from './AppText';
import {
  resolveSarhButtonColors,
  type SarhButtonState,
  type SarhButtonVariant,
} from './resolvers';

export type SarhButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: SarhButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode | string;
  rightIcon?: ReactNode | string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export { resolveSarhButtonColors } from './resolvers';
export type { SarhButtonState, SarhButtonVariant } from './resolvers';

function renderIcon(icon: ReactNode | string | undefined, color: string) {
  if (!icon) return null;
  if (typeof icon === 'string') {
    return <AppIcon name={icon} size={typography.label.fontSize} color={color} />;
  }
  return icon;
}

export function SarhButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  style,
  testID,
}: SarhButtonProps) {
  const blocked = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={blocked ? undefined : onPress}
      style={({ pressed }) => {
        const state: Exclude<SarhButtonState, 'loading'> = blocked
          ? 'disabled'
          : pressed
            ? 'pressed'
            : 'default';
        const palette = resolveSarhButtonColors(variant, state);
        return [
          getRtlRow(),
          {
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: space[48],
            paddingHorizontal: space[20],
            gap: space[8],
            borderRadius: radius[12],
            borderWidth: variant === 'ghost' ? 0 : 1,
            backgroundColor: palette.backgroundColor,
            borderColor: palette.borderColor,
            opacity: blocked ? motion.opacity.disabled : pressed ? motion.opacity.pressed : 1,
            transform: [{ scale: pressed && !blocked ? motion.pressScale : 1 }],
            width: fullWidth ? '100%' : undefined,
          },
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const state: Exclude<SarhButtonState, 'loading'> = blocked ? 'disabled' : pressed ? 'pressed' : 'default';
        const palette = resolveSarhButtonColors(variant, state);
        return (
          <>
            {loading ? (
              <ActivityIndicator color={palette.contentColor} />
            ) : (
              renderIcon(leftIcon, palette.contentColor)
            )}
            <AppText variant="label" color="textPrimary" style={{ color: palette.contentColor }}>
              {title}
            </AppText>
            {loading ? null : renderIcon(rightIcon, palette.contentColor)}
          </>
        );
      }}
    </Pressable>
  );
}

export default SarhButton;
