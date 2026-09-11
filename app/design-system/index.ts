/**
 * Sarh Design System — tokens + core UI primitives.
 *
 * Existing screens may keep importing `@/constants/theme` and
 * `@/components/ui/*`. New UI should prefer this module.
 */
export {
  SEMANTIC_TYPE_ROLE,
  TYPE_ROLE_ALIAS,
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
  resolveTypeRole,
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
  SemanticTypeRole,
  SpaceToken,
  TypeRole,
  TypeRoleAlias,
  TypeToken,
  TypeVariant,
} from './tokens';
export { semantic, theme } from './theme';
export type { Theme } from './theme';
export { FONT_WEIGHT_MIGRATION, HARDCODED_AUDIT, LEGACY_TOKEN_MAP, PHASE_2_SCOPE } from './migration';
