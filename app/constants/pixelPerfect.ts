/** @deprecated Use `ds` from `@/constants/designSystem` */
import { ds } from './designSystem';

export const pp = {
  pageBg: ds.light.page,
  cardBg: ds.light.card,
  primary: ds.light.primary,
  primaryDark: '#084D2A',
  textPrimary: '#0A0F0C',
  textSecondary: '#6B7A72',
  textMuted: '#9CA8A0',
  border: ds.light.stroke,
  borderSoft: 'rgba(11, 107, 58, 0.12)',
  chipInactiveBg: '#ECEFF1',
  verifiedBg: '#E8F5EF',
  verifiedText: ds.light.primary,
  space: ds.space,
  radius: {
    sm: ds.radius.sm,
    md: ds.radius.md,
    lg: ds.radius.lg,
    xl: ds.radius.xl,
    pill: ds.radius.pill,
    fab: ds.radius.fab,
  },
  headerIcon: ds.iconBtn.md,
  headerIconLg: ds.iconBtn.md,
  categoryTile: ds.categoryTile,
  listingThumb: ds.listingThumb,
  tabFab: ds.tabBar.fabSize,
  shadowCard: {},
  shadowHeaderBtn: {},
};
