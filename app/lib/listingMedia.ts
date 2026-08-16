import type { Listing } from '@/services/types';

export const LISTING_VIDEO_EXT = /\.(mp4|mov|webm|m4v|quicktime)(\?|$)/i;
const LISTING_VIDEO_HINT = /\/video\/|resource_type=video|\/videos\//i;

function trimUri(uri?: string | null): string | undefined {
  const value = typeof uri === 'string' ? uri.trim() : '';
  return value.length > 0 ? value : undefined;
}

export function isListingVideoUri(uri?: string | null): boolean {
  const value = trimUri(uri);
  if (!value) return false;
  return LISTING_VIDEO_EXT.test(value) || LISTING_VIDEO_HINT.test(value);
}

export function listingPhotoUris(listing: Pick<Listing, 'images'>): string[] {
  return (listing.images ?? []).filter((uri) => {
    const value = trimUri(uri);
    return !!value && !isListingVideoUri(value);
  });
}

export function listingVideoUrl(
  listing: Pick<Listing, 'images' | 'videoUrl'>,
): string | undefined {
  const dedicated = trimUri(listing.videoUrl);
  if (dedicated) return dedicated;
  return (listing.images ?? []).find((uri) => isListingVideoUri(uri));
}

export function listingHasVideo(
  listing: Pick<Listing, 'images' | 'videoUrl'>,
): boolean {
  return !!listingVideoUrl(listing);
}

export function listingThumbUri(
  listing: Pick<Listing, 'images' | 'thumbnailUrl'>,
): string | undefined {
  return listingPhotoUris(listing)[0] ?? trimUri(listing.thumbnailUrl);
}
