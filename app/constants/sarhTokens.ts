/**
 * Sarh Premium Design System — 2026
 * White = content · Green = actions only
 */
export const sarh = {
  color: {
    bg: '#0B1622',
    surface: '#101F2C',
    surfaceRaised: '#122532',
    surfaceAlt: '#162D3A',
    action: '#20B66F',
    actionPressed: '#18965B',
    actionMuted: 'rgba(32, 182, 111, 0.14)',
    text: '#F4F6F5',
    textSecondary: '#D6DDE0',
    textMuted: '#94A3AC',
    border: 'rgba(150, 175, 185, 0.18)',
    pattern: '#294454',
    fab: '#FFFFFF',
    fabIcon: '#0B1622',
    overlay: 'rgba(11, 22, 34, 0.88)',
    danger: '#E85D5D',
    warning: '#D4A017',
    success: '#20B66F',
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radius: {
    sm: 12,
    md: 14,
    lg: 18,
    xl: 20,
    card: 20,
    pill: 999,
    fab: 16,
  },
  pattern: {
    opacity: 0.06,
  },
} as const;

export type SarhTokens = typeof sarh;
