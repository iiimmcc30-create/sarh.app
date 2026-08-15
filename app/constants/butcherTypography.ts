import { appFont } from '@/constants/fonts';
import { typography } from '@/constants/theme';
import type { TextStyle } from 'react-native';

/**
 * Butcher market UI type — aligned with main app FloatingTabBar.
 * Typeface: IBM Plex Sans Arabic (400 / 500 / 600).
 */
export const BUTCHER_FONT = 'IBM Plex Sans Arabic' as const;

const rtl: Pick<TextStyle, 'writingDirection'> = { writingDirection: 'rtl' };

/** Inactive tab label — mirrors FloatingTabBar (`appFont.medium`, 500). */
export const butcherTabLabel: TextStyle = {
  fontFamily: appFont.medium,
  fontWeight: '500',
  fontSize: 10,
  lineHeight: 13,
  textAlign: 'center',
  ...rtl,
};

/** Active tab label — mirrors FloatingTabBar (`appFont.semibold`, 600). */
export const butcherTabLabelActive: TextStyle = {
  fontFamily: appFont.semibold,
  fontWeight: '600',
  fontSize: 10,
  lineHeight: 13,
  textAlign: 'center',
  ...rtl,
};

export const butcherTypography = {
  tab: butcherTabLabel,
  tabActive: butcherTabLabelActive,
  /** Screen / section titles */
  title: { ...typography.h3 },
  titleLarge: { ...typography.h2 },
  /** Primary row labels, prices, CTAs */
  primary: { ...typography.bodyStrong },
  /** Body paragraphs */
  body: { ...typography.body },
  /** Secondary hints, subtitles — lighter regular 400 */
  secondary: {
    ...typography.caption,
    fontFamily: appFont.regular,
    fontWeight: '400',
  },
  /** Timestamps, meta chips, ratings — lighter regular 400 */
  meta: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.2,
    fontFamily: appFont.regular,
    fontWeight: '400',
    ...rtl,
  },
  /** Selected chips / mild emphasis — medium 500 (not 700) */
  emphasis: {
    fontFamily: appFont.medium,
    fontWeight: '500',
    ...rtl,
  },
  /** Badge numerals on icons */
  badge: {
    fontSize: 9,
    lineHeight: 12,
    fontFamily: appFont.medium,
    fontWeight: '500',
    ...rtl,
  },
} as const;
