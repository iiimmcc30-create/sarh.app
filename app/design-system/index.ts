/**
 * Sarh Design Foundation — phase 1 tokens only.
 *
 * Live screens must keep importing `@/constants/theme`, `sarhTokens`,
 * `designSystem`, and `fonts`. Do not rewire UI to this module yet.
 */
export {
  colors,
  duration,
  elevation,
  fontFamily,
  fontWeight,
  functional,
  motion,
  palette,
  radius,
  radiusAlias,
  space,
  spaceAlias,
  typography,
} from './tokens';
export type {
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
export { HARDCODED_AUDIT, LEGACY_TOKEN_MAP, PHASE_2_SCOPE } from './migration';
