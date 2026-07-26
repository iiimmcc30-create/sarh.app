import type { Listing } from '@/services/types';

/** Pinned listings first, then featured, then newest. */
export function compareListingBoostPriority(a: Listing, b: Listing): number {
  const pinnedDiff = Number(b.pinned) - Number(a.pinned);
  if (pinnedDiff !== 0) return pinnedDiff;
  const featuredDiff = Number(b.featured) - Number(a.featured);
  if (featuredDiff !== 0) return featuredDiff;
  const ta = new Date(a.createdAt ?? 0).getTime();
  const tb = new Date(b.createdAt ?? 0).getTime();
  return tb - ta;
}
