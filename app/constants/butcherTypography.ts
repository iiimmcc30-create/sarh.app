/**
 * Butcher UI typography — aliases global `typography` (IBM Plex Sans Arabic).
 * `tab` / `tabActive` stay frozen for ButchersTabBar.
 */
import { APP_FONT_NAME } from '@/constants/fonts';
import { typography } from '@/constants/theme';

export { APP_FONT_NAME as BUTCHER_FONT };

export const butcherTabLabel = typography.tab;
export const butcherTabLabelActive = typography.tabActive;

export const butcherTypography = {
  tab: typography.tab,
  tabActive: typography.tabActive,
  title: typography.subsection,
  titleLarge: typography.sectionHeading,
  primary: typography.bodyLarge,
  body: typography.body,
  secondary: typography.bodySmall,
  meta: typography.caption,
  emphasis: typography.label,
  badge: typography.badge,
} as const;
