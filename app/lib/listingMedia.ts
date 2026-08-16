import type { Listing } from '@/services/types';

export const LISTING_VIDEO_EXT = /\.(mp4|mov|webm|m4v)(\?|$)/i;

function trimUri(uri?: string | null): string | undefined {
  const value = typeof uri === 'string' ? uri.trim() : '';
  return value.length > 0 ? value : undefined;
}

export function listingPhotoUris(listing: Pick<Listing, 'images'>): string[] {
  return (listing.images ?? []).filter((uri) => {
    const value = trimUri(uri);
    return !!value && !LISTING_VIDEO_EXT.test(value);
  });
}

export function listingVideoUrl(
  listing: Pick<Listing, 'images' | 'videoUrl'>,
): string | undefined {
  const dedicated = trimUri(listing.videoUrl);
  if (dedicated) return dedicated;
  return (listing.images ?? []).find((uri) => {
    const value = trimUri(uri);
    return !!value && LISTING_VIDEO_EXT.test(value);
  });
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
