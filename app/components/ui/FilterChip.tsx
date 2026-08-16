import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { typography, type ThemeColors } from '@/constants/theme';
import { appFont } from '@/constants/fonts';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';

/** Unified filter / category chip — text only, fixed height, content-width. */
export const FILTER_CHIP = {
  height: 46,
  paddingHorizontal: 22,
  radius: 15,
  gap: 10,
  /** Idle surface — dark near #101F2C; themed via bgSurface / elevated. */
  idleSurfaceFallback: '#101F2C',
} as const;

type FilterChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function FilterChip({
  label,
  selected = false,
  onPress,
  disabled = false,
  style,
  testID,
}: FilterChipProps) {
  const styles = useThemedStyles(({ colors }) => createChipStyles(colors));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && !disabled && styles.chipPressed,
        disabled && styles.chipDisabled,
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.label, selected && styles.labelSelected]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type FilterChipRowProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Horizontal inset around the row (default 16). */
  contentPaddingHorizontal?: number;
};

/** Horizontal scroller for FilterChip items — RTL-aware, no flex stretch. */
export function FilterChipRow({
  children,
  contentContainerStyle,
  style,
  contentPaddingHorizontal = 16,
}: FilterChipRowProps) {
  const styles = useThemedStyles(({ colors }) => createRowStyles(colors));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={[
        styles.content,
        getRtlRow(),
        { paddingHorizontal: contentPaddingHorizontal },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

function createChipStyles(colors: ThemeColors) {
  return StyleSheet.create({
    chip: {
      height: FILTER_CHIP.height,
      paddingHorizontal: FILTER_CHIP.paddingHorizontal,
      borderRadius: FILTER_CHIP.radius,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
      flexShrink: 0,
      flexGrow: 0,
      maxWidth: '100%',
      backgroundColor: colors.bgSurface || FILTER_CHIP.idleSurfaceFallback,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
    },
    chipSelected: {
      backgroundColor: colors.electricBright,
      borderColor: colors.electricBright,
    },
    chipPressed: {
      opacity: 0.88,
    },
    chipDisabled: {
      opacity: 0.45,
    },
    label: {
      ...typography.chip,
      color: colors.textSecondary,
      textAlign: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    labelSelected: {
      fontFamily: appFont.semibold,
      fontWeight: '600',
      fontSize: typography.chip.fontSize,
      lineHeight: typography.chip.lineHeight,
      color: '#FFFFFF',
      textAlign: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
  });
}

function createRowStyles(_colors: ThemeColors) {
  return StyleSheet.create({
    scroll: {
      flexGrow: 0,
      flexShrink: 0,
    },
    content: {
      alignItems: 'center',
      gap: FILTER_CHIP.gap,
      paddingVertical: 2,
    },
  });
}
