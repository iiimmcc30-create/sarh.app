import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { motion, radius, space } from '../tokens';
import {
  ICON_BUTTON_SIZE,
  resolveSarhIconButtonColors,
  type SarhIconButtonSize,
  type SarhIconButtonState,
} from './resolvers';

export type SarhIconButtonProps = {
  icon?: ReactNode | string;
  children?: ReactNode;
  onPress?: () => void;
  size?: SarhIconButtonSize;
  disabled?: boolean;
  selected?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export { ICON_BUTTON_SIZE, resolveSarhIconButtonColors } from './resolvers';
export type { SarhIconButtonSize, SarhIconButtonState } from './resolvers';

export function SarhIconButton({
  icon,
  children,
  onPress,
  size = 'md',
  disabled = false,
  selected = false,
  accessibilityLabel,
  style,
  testID,
}: SarhIconButtonProps) {
  const metrics = ICON_BUTTON_SIZE[size];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      hitSlop={space[4]}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => {
        const state: SarhIconButtonState = disabled
          ? 'disabled'
          : selected
            ? 'selected'
            : pressed
              ? 'pressed'
              : 'default';
        const palette = resolveSarhIconButtonColors(state === 'disabled' ? 'default' : state);
        return [
          {
            width: metrics.box,
            height: metrics.box,
            minWidth: metrics.box,
            minHeight: metrics.box,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radius[12],
            borderWidth: 1,
            backgroundColor: palette.backgroundColor,
            borderColor: palette.borderColor,
            opacity: disabled ? motion.opacity.disabled : pressed ? motion.opacity.pressed : 1,
          },
          style,
        ];
      }}
    >
      {({ pressed }) => {
        const state: SarhIconButtonState = disabled
          ? 'disabled'
          : selected
            ? 'selected'
            : pressed
              ? 'pressed'
              : 'default';
        const palette = resolveSarhIconButtonColors(state === 'disabled' ? 'default' : state);
        if (children) return children;
        if (typeof icon === 'string') {
          return <AppIcon name={icon} size={metrics.icon} color={palette.contentColor} />;
        }
        return icon ?? null;
      }}
    </Pressable>
  );
}

export default SarhIconButton;
