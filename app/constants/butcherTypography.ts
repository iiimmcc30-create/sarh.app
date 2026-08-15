/**
 * Butcher UI typography — aliases global `typography` (IBM Plex Sans Arabic).
 * Kept for butcher imports; source of truth is `@/constants/theme`.
 */
import { APP_FONT_NAME } from '@/constants/fonts';
import { typography } from '@/constants/theme';

export { APP_FONT_NAME as BUTCHER_FONT };

export const butcherTabLabel = typography.tab;
export const butcherTabLabelActive = typography.tabActive;

export const butcherTypography = {
  tab: typography.tab,
  tabActive: typography.tabActive,
  title: typography.h3,
  titleLarge: typography.h2,
  primary: typography.bodyStrong,
  body: typography.body,
  secondary: typography.caption,
  meta: typography.micro,
  emphasis: typography.emphasis,
  badge: {
    ...typography.emphasis,
    fontSize: 9,
    lineHeight: 12,
  },
} as const;
