/** Shared FilterChip size tokens — safe to import in Jest without RN icon trees. */
export const FILTER_CHIP = {
  height: 46,
  paddingHorizontal: 20,
  radius: 14,
  gap: 10,
  fontSize: 14,
  lineHeight: 20,
  /** Idle surface — dark near #101F2C; themed via bgSurface / elevated. */
  idleSurfaceFallback: '#101F2C',
} as const;
