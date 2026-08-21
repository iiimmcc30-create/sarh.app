import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { FILTER_CHIP, MARKET_CHIP } from '@/components/ui/filterChipTokens';

export { FILTER_CHIP, MARKET_CHIP } from '@/components/ui/filterChipTokens';

type FilterChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Optional leading/trailing icon (Lucide/legacy name). */
  icon?: string;
  /** Show checkmark circle when selected (market «الكل» style). */
  selectedCheck?: boolean;
  /** Dropdown chevron on the opposite side of the label. */
  chevron?: boolean;
  /** Optional emoji / custom node before the label (RTL: visual right). */
  leading?: ReactNode;
  /** Smaller chip for market region / category rows. */
  compact?: boolean;
};

export function FilterChip({
  label,
  selected = false,
  onPress,
  disabled = false,
  style,
  testID,
  icon,
  selectedCheck = false,
  chevron = false,
  leading,
  compact = false,
}: FilterChipProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createChipStyles(theme.colors, compact),
    colors: theme.colors,
  }));

  const iconColor = selected ? '#FFFFFF' : colors.textSecondary;
  const iconSize = compact ? MARKET_CHIP.iconSize : 15;

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
      <View style={[styles.inner, getRtlRow()]}>
        {selected && selectedCheck ? (
          <View style={styles.checkCircle}>
            <AppIcon name="checkmark" size={compact ? 9 : 11} color={colors.electricBright} />
          </View>
        ) : leading ? (
          leading
        ) : icon ? (
          <AppIcon name={icon} size={iconSize} color={iconColor} />
        ) : null}
        <Text
          numberOfLines={1}
          style={[styles.label, selected && styles.labelSelected]}
        >
          {label}
        </Text>
        {chevron ? (
          <AppIcon name="angle-down" size={compact ? 11 : 13} color={iconColor} />
        ) : null}
      </View>
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

function createChipStyles(colors: ThemeColors, compact: boolean) {
  const tokens = compact ? MARKET_CHIP : FILTER_CHIP;
  return StyleSheet.create({
    chip: {
      height: tokens.height,
      paddingHorizontal: tokens.paddingHorizontal,
      borderRadius: tokens.radius,
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
    inner: {
      alignItems: 'center',
      gap: tokens.gap,
      maxWidth: '100%',
    },
    checkCircle: {
      width: compact ? MARKET_CHIP.checkSize : 18,
      height: compact ? MARKET_CHIP.checkSize : 18,
      borderRadius: compact ? MARKET_CHIP.checkSize / 2 : 9,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      fontSize: tokens.fontSize,
      lineHeight: tokens.lineHeight,
      color: colors.textPrimary,
      textAlign: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    labelSelected: {
      color: '#FFFFFF',
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
