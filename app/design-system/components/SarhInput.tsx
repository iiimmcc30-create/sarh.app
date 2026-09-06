import { useState, type ReactNode } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { getRtlRow, rtlInputText } from '@/lib/rtl';
import { colors, motion, radius, space, typography } from '../tokens';
import { AppText } from './AppText';
import { resolveSarhInputBorder, type SarhInputState } from './resolvers';

export type SarhInputProps = TextInputProps & {
  label?: string;
  helperText?: string;
  errorText?: string;
  leadingIcon?: ReactNode | string;
  trailingIcon?: ReactNode | string;
  onTrailingPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

export { resolveSarhInputBorder } from './resolvers';
export type { SarhInputState } from './resolvers';

function renderFieldIcon(icon: ReactNode | string | undefined, color: string) {
  if (!icon) return null;
  if (typeof icon === 'string') {
    return <AppIcon name={icon} size={typography.body.fontSize} color={color} />;
  }
  return icon;
}

export function SarhInput({
  label,
  helperText,
  errorText,
  leadingIcon,
  trailingIcon,
  onTrailingPress,
  containerStyle,
  editable = true,
  secureTextEntry,
  onFocus,
  onBlur,
  placeholder,
  accessibilityLabel,
  style,
  ...rest
}: SarhInputProps) {
  const [focused, setFocused] = useState(false);
  const disabled = editable === false;
  const state: SarhInputState = disabled
    ? 'disabled'
    : errorText
      ? 'error'
      : focused
        ? 'focused'
        : 'default';
  const borderColor = resolveSarhInputBorder(state);
  const iconColor = state === 'error' ? colors.danger : colors.textMuted;

  return (
    <View style={containerStyle}>
      {label ? (
        <AppText variant="label" color="textSecondary" style={{ marginBottom: space[8] }}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          getRtlRow(),
          {
            alignItems: 'center',
            minHeight: space[48],
            paddingHorizontal: space[12],
            gap: space[8],
            borderRadius: radius[12],
            borderWidth: 1,
            borderColor,
            backgroundColor: colors.surface,
            opacity: disabled ? motion.opacity.disabled : 1,
          },
        ]}
      >
        {renderFieldIcon(leadingIcon, iconColor)}
        <TextInput
          {...rest}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          accessibilityState={{ disabled }}
          style={[
            rtlInputText,
            {
              flex: 1,
              fontFamily: typography.body.fontFamily,
              fontSize: typography.body.fontSize,
              lineHeight: typography.body.lineHeight,
              fontWeight: typography.body.fontWeight,
              color: colors.textPrimary,
              paddingVertical: space[12],
            },
            style,
          ]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {trailingIcon ? (
          <Pressable
            onPress={onTrailingPress}
            disabled={!onTrailingPress || disabled}
            accessibilityRole={onTrailingPress ? 'button' : 'none'}
            hitSlop={space[8]}
          >
            {renderFieldIcon(trailingIcon, iconColor)}
          </Pressable>
        ) : null}
      </View>
      {errorText ? (
        <AppText variant="caption" color="danger" style={{ marginTop: space[4] }}>
          {errorText}
        </AppText>
      ) : null}
      {!errorText && helperText ? (
        <AppText variant="caption" color="textMuted" style={{ marginTop: space[4] }}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}

export default SarhInput;
