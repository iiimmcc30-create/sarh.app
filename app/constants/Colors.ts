/**
 * Legacy Expo Colors — aliased to Sarh design tokens for any remaining consumers.
 * Prefer `@/constants/theme` or `@/constants/designSystem` in new code.
 */

const tintColorLight = '#20B66F';
const tintColorDark = '#20B66F';

export const Colors = {
  light: {
    text: '#101820',
    background: '#F5F7F9',
    tint: tintColorLight,
    icon: '#65727D',
    tabIconDefault: '#8D99A3',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F4F7F9',
    background: '#07131C',
    tint: tintColorDark,
    icon: '#94A6B2',
    tabIconDefault: '#657985',
    tabIconSelected: tintColorDark,
  },
};
