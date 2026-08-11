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
import { appFont } from '@/constants/fonts';
import { controls, radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlText, ltrInputText, marginStart, rtlInputText, getRtlRow } from '@/lib/rtl';

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
              borderWidth: 1.5,
              backgroundColor: colors.bgSurface,
            }
          : {
              borderColor: colors.borderSoft,
              borderWidth: StyleSheet.hairlineWidth,
              backgroundColor: colors.bgSurface,
            },
      });
    },
    [colors.bgSurface, colors.borderSoft, colors.electric],
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
      {label ? (
        <View style={styles.rtlTextShell}>
          <Text style={styles.label}>{label}</Text>
        </View>
      ) : null}
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
      {error ? (
        <View style={styles.rtlTextShell}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}
      {!error && hint ? (
        <View style={styles.rtlTextShell}>
          <Text style={styles.hint}>{hint}</Text>
        </View>
      ) : null}
    </View>
  );
}

export const AppTextInput = memo(AppTextInputComponent);

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    /** Physical LTR shell — same as listing title / SidebarMenuItem. */
    rtlTextShell: {
      width: '100%',
      direction: 'ltr',
    },
    label: {
      ...typography.caption,
      fontFamily: appFont.medium,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    wrap: {
      ...getRtlRow(),
      alignItems: 'center',
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
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
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    hint: {
      ...typography.micro,
      color: colors.textMuted,
      marginTop: spacing.xs,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
  });
}
