import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { FILTER_CHIP } from '@/components/ui/filterChipTokens';

export { FILTER_CHIP, MARKET_CHIP } from '@/components/ui/filterChipTokens';

type FilterChipRowProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Horizontal inset around the row (default 16). */
  contentPaddingHorizontal?: number;
};

/** Horizontal scroller for filter chips — RTL-aware, no flex stretch. */
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
