import { sarh } from '@/constants/sarhTokens';

/**
 * Raw Sarh Dark palette — extracted from `sarh.color`.
 * Do not invent brand greens. Hex values stay identical to the live tokens.
 */
export const palette = {
  bg: sarh.color.bg,
  surface: sarh.color.surface,
  surfaceRaised: sarh.color.surfaceRaised,
  surfaceAlt: sarh.color.surfaceAlt,
  action: sarh.color.action,
  actionPressed: sarh.color.actionPressed,
  text: sarh.color.text,
  textSecondary: sarh.color.textSecondary,
  textMuted: sarh.color.textMuted,
  border: sarh.color.border,
  danger: sarh.color.danger,
  warning: sarh.color.warning,
  success: sarh.color.success,
} as const;

/**
 * Flat semantic colors required by the foundation contract.
 * Values are aliases of the live palette — not a new visual system.
 *
 * `borderStrong` is the live dark `theme.ts` token (`#264556`), which is not
 * on `sarh.color`. It is extracted, not invented.
 */
export const colors = {
  background: palette.bg,
  surface: palette.surface,
  surfaceElevated: palette.surfaceRaised,
  surfaceAlt: palette.surfaceAlt,
  primary: palette.action,
  primaryPressed: palette.actionPressed,
  textPrimary: palette.text,
  textSecondary: palette.textSecondary,
  textMuted: palette.textMuted,
  border: palette.border,
  borderStrong: '#264556',
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
} as const;

/**
 * Functional extras already in `sarh.color`. Not new brand colors.
 * - overlay: full-screen dim (`rgba(7, 19, 28, 0.88)`)
 * - pattern: hairline / motif (`#1E3A4A`)
 * - primaryMuted: brand-green wash for chips (`rgba(32, 182, 111, 0.14)`)
 */
export const functional = {
  overlay: sarh.color.overlay,
  pattern: sarh.color.pattern,
  primaryMuted: sarh.color.actionMuted,
} as const;

export type ColorToken = keyof typeof colors;
