import type { Listing } from '@/services/types';

/** Pinned listings first, then featured, then subscriber priority, then newest. */
export function compareListingBoostPriority(a: Listing, b: Listing): number {
  const pinnedDiff = Number(b.pinned) - Number(a.pinned);
  if (pinnedDiff !== 0) return pinnedDiff;
  const featuredDiff = Number(b.featured) - Number(a.featured);
  if (featuredDiff !== 0) return featuredDiff;
  const verifiedDiff = Number(b.seller?.verified) - Number(a.seller?.verified);
  if (verifiedDiff !== 0) return verifiedDiff;
  const ta = new Date(a.createdAt ?? 0).getTime();
  const tb = new Date(b.createdAt ?? 0).getTime();
  return tb - ta;
}
