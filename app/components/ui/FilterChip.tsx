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
import { getCoverTrailRowStyle, getRtlRow } from '@/lib/rtl';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { FILTER_CHIP } from '@/components/ui/filterChipTokens';
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';

export { FILTER_CHIP } from '@/components/ui/filterChipTokens';

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
  /** Cover trail: physical LTR, accessory on the right of the label. */
  cover?: boolean;
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
  cover = false,
}: FilterChipProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createChipStyles(theme.colors),
    colors: theme.colors,
  }));

  const iconColor = selected ? '#FFFFFF' : colors.textSecondary;

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
      {cover ? (
        <CoverTrailRow justify="flex-end" gap={7}>
          <Text
            numberOfLines={1}
            style={[styles.label, selected && styles.labelSelected]}
          >
            {label}
          </Text>
          {selected && selectedCheck ? (
            <View style={styles.checkCircle}>
              <AppIcon name="checkmark" size={11} color={colors.electricBright} />
            </View>
          ) : leading ? (
            leading
          ) : icon ? (
            <AppIcon name={icon} size={15} color={iconColor} />
          ) : chevron ? (
            <AppIcon name="angle-down" size={13} color={iconColor} />
          ) : null}
        </CoverTrailRow>
      ) : (
        <View style={[styles.inner, getRtlRow()]}>
          {selected && selectedCheck ? (
            <View style={styles.checkCircle}>
              <AppIcon name="checkmark" size={11} color={colors.electricBright} />
            </View>
          ) : leading ? (
            leading
          ) : icon ? (
            <AppIcon name={icon} size={15} color={iconColor} />
          ) : null}
          <Text
            numberOfLines={1}
            style={[styles.label, selected && styles.labelSelected]}
          >
            {label}
          </Text>
          {chevron ? (
            <AppIcon name="angle-down" size={13} color={iconColor} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

type FilterChipRowProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Horizontal inset around the row (default 16). */
  contentPaddingHorizontal?: number;
  /** Physical LTR cover trail — chips hug the right edge. */
  cover?: boolean;
};

/** Horizontal scroller for FilterChip items — RTL-aware, no flex stretch. */
export function FilterChipRow({
  children,
  contentContainerStyle,
  style,
  contentPaddingHorizontal = 16,
  cover = false,
}: FilterChipRowProps) {
  const styles = useThemedStyles(({ colors }) => createRowStyles(colors));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={[
        styles.content,
        cover
          ? getCoverTrailRowStyle({ justifyContent: 'flex-end', gap: FILTER_CHIP.gap })
          : getRtlRow(),
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
    inner: {
      alignItems: 'center',
      gap: 7,
      maxWidth: '100%',
    },
    checkCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      fontSize: FILTER_CHIP.fontSize,
      lineHeight: FILTER_CHIP.lineHeight,
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
