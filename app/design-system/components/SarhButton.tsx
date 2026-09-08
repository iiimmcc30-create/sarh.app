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
  BUTTON_SIZE,
  resolveSarhButtonColors,
  type SarhButtonShape,
  type SarhButtonSize,
  type SarhButtonState,
  type SarhButtonVariant,
} from './resolvers';

export type SarhButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: SarhButtonVariant;
  size?: SarhButtonSize;
  shape?: SarhButtonShape;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode | string;
  rightIcon?: ReactNode | string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export { BUTTON_SIZE, resolveSarhButtonColors } from './resolvers';
export type { SarhButtonShape, SarhButtonSize, SarhButtonState, SarhButtonVariant } from './resolvers';

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
  size = 'md',
  shape = 'rounded',
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
        const metrics = BUTTON_SIZE[size];
        return [
          getRtlRow(),
          {
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: metrics.minHeight,
            paddingHorizontal: metrics.paddingHorizontal,
            gap: space[8],
            borderRadius: shape === 'pill' ? radius[999] : radius[12],
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
            <AppText
              variant={size === 'sm' ? 'caption' : 'label'}
              color="textPrimary"
              style={{ color: palette.contentColor }}
            >
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
