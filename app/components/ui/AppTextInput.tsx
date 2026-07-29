import React, { memo, useCallback, useRef } from 'react';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { controls, radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { ltrInputText, marginStart, rtlInputText, rtlRow } from '@/lib/rtl';

interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** للحقول الإنجليزية أو الأرقام فقط */
  ltr?: boolean;
}

function AppTextInputComponent({
  label,
  error,
  hint,
  icon,
  containerStyle,
  ltr = false,
  style,
  placeholderTextColor,
  onFocus,
  onBlur,
  editable = true,
  ...props
}: AppTextInputProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));
  const inputStyle = ltr ? ltrInputText : rtlInputText;
  const focusedRef = useRef(false);
  const wrapRef = useRef<View>(null);

  const applyFocusVisual = useCallback(
    (focused: boolean) => {
      focusedRef.current = focused;
      wrapRef.current?.setNativeProps({
        style: focused
          ? {
              borderColor: colors.electric,
              backgroundColor: colors.bgSurface,
            }
          : {
              borderColor: colors.borderSoft,
              backgroundColor: colors.bgElevated,
            },
      });
    },
    [colors.bgElevated, colors.bgSurface, colors.borderSoft, colors.electric],
  );

  const handleFocus = useCallback(
    (event: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      applyFocusVisual(true);
      onFocus?.(event);
    },
    [applyFocusVisual, onFocus],
  );

  const handleBlur = useCallback(
    (event: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      applyFocusVisual(false);
      onBlur?.(event);
    },
    [applyFocusVisual, onBlur],
  );

  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        ref={wrapRef}
        style={[
          styles.wrap,
          error ? styles.wrapError : null,
          !editable && styles.wrapDisabled,
        ]}
      >
        {icon ? (
          <View style={styles.iconBubble}>
            <AppIcon
              name={icon}
              size={18}
              color={colors.textMuted}
            />
          </View>
        ) : null}
        <TextInput
          placeholderTextColor={placeholderTextColor ?? colors.textSubtle}
          style={[styles.input, inputStyle, style]}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export const AppTextInput = memo(AppTextInputComponent);

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    label: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: spacing.xs,
      textAlign: 'right',
    },
    wrap: {
      ...rtlRow,
      alignItems: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      paddingHorizontal: spacing.sm,
      minHeight: controls.heightLg,
    },
    wrapError: {
      borderColor: colors.danger,
    },
    wrapDisabled: { opacity: 0.55 },
    iconBubble: {
      width: 34,
      height: 34,
      borderRadius: radius.md,
      backgroundColor: colors.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
      ...marginStart(spacing.sm),
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
    },
    error: {
      ...typography.micro,
      color: colors.danger,
      marginTop: spacing.xs,
      textAlign: 'right',
    },
    hint: {
      ...typography.micro,
      color: colors.textMuted,
      marginTop: spacing.xs,
      textAlign: 'right',
    },
  });
}
