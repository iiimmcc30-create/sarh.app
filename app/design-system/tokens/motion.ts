/**
 * Semantic durations in milliseconds (React Native Animated / LayoutAnimation).
 * Central place to tune motion — live `ds.motion.duration` remains 220 until a later phase.
 */
export const duration = {
  instant: 0,
  fast: 120,
  normal: 200,
  slow: 300,
} as const;

export const opacity = {
  disabled: 0.45,
  pressed: 0.88,
} as const;

export const motion = {
  duration,
  opacity,
  pressScale: 0.97,
} as const;

export type DurationToken = keyof typeof duration;
