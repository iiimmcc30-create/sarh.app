/**
 * Sarh Design System — tokens + core UI primitives.
 *
 * Existing screens may keep importing `@/constants/theme` and
 * `@/components/ui/*`. New UI should prefer this module.
 */
export {
  applyButtonTokens,
  buttonColors,
  buttonMetrics,
  colors,
  duration,
  elevation,
  fontFamily,
  fontWeight,
  functional,
  motion,
  opacity,
  palette,
  radius,
  radiusAlias,
  space,
  spaceAlias,
  typography,
} from './tokens';
export type {
  ButtonSizeName,
  ButtonTone,
  ButtonVariantName,
  ColorToken,
  DurationToken,
  ElevationName,
  ElevationToken,
  RadiusToken,
  SpaceToken,
  TypeRole,
  TypeToken,
} from './tokens';
export { darkTheme, semantic } from './theme';
export type { DarkTheme } from './theme';
export { FONT_WEIGHT_MIGRATION, HARDCODED_AUDIT, LEGACY_TOKEN_MAP, PHASE_2_SCOPE } from './migration';
