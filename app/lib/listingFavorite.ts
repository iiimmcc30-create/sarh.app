/** Listings have no favorite API; do not fake success or reuse post bookmarks. */
export type ListingFavoriteFeedback = {
  kind: 'unavailable';
  title: string;
  message: string;
};

export function listingFavoriteFeedback(): ListingFavoriteFeedback {
  return {
    kind: 'unavailable',
    title: 'غير متاح',
    message: 'حفظ الإعلانات في المفضّلة غير متاح حالياً.',
  };
}
