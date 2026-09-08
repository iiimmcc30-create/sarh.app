import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { getRtlRow } from '@/lib/rtl';
import { motion, radius, space } from '../tokens';
import { AppText } from './AppText';
import { resolveSarhChipColors } from './resolvers';

export type SarhChipProps = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export { resolveSarhChipColors } from './resolvers';
export type { SarhChipState } from './resolvers';

export function SarhChip({
  label,
  selected = false,
  disabled = false,
  onPress,
  leading,
  style,
  testID,
}: SarhChipProps) {
  const palette = resolveSarhChipColors(selected);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        getRtlRow(),
        {
          alignItems: 'center',
          alignSelf: 'flex-start',
          minHeight: space[32],
          paddingHorizontal: space[12],
          gap: space[8],
          borderRadius: radius[999],
          borderWidth: 1,
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: disabled ? motion.opacity.disabled : pressed ? motion.opacity.pressed : 1,
        },
        style,
      ]}
    >
      {leading}
      <AppText
        variant="caption"
        color={palette.text}
        style={palette.textOverride ? { color: palette.textOverride } : undefined}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

export default SarhChip;
