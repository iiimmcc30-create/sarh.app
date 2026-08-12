import type { Listing } from '@/services/types';

/** Live livestock species — weight is NOT required (only ذبائح). */
export const LIVESTOCK_CATEGORIES: Listing['category'][] = [
  'camels',
  'sheep',
  'goats',
  'cows',
  'horses',
];

export function isLivestockCategory(
  category?: Listing['category'] | string | null,
): boolean {
  return LIVESTOCK_CATEGORIES.includes(category as Listing['category']);
}

export function isSlaughterCategory(
  category?: Listing['category'] | string | null,
): boolean {
  return category === 'slaughter';
}

/** Weight required only for ذبائح (slaughter) or parent.requiresWeight. */
export function categoryRequiresWeight(opts: {
  category?: string | null;
  requiresWeight?: boolean | null;
}): boolean {
  if (opts.requiresWeight === true) return true;
  return isSlaughterCategory(opts.category);
}
