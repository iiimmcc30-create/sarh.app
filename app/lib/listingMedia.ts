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

/**
 * Cloudinary first-frame still from a video delivery URL (so_0).
 * Used when a listing has video but no uploaded thumbnail / photos.
 */
export function cloudinaryVideoFirstFrameUrl(
  videoUrl?: string | null,
): string | undefined {
  const value = trimUri(videoUrl);
  if (!value) return undefined;
  if (!/res\.cloudinary\.com/i.test(value)) return undefined;
  if (!/\/video\/upload\//i.test(value)) return undefined;
  // Already a transformed still
  if (/\/video\/upload\/[^/]*so_/i.test(value)) {
    return value.replace(/\.(mp4|mov|webm|m4v)(\?|$)/i, '.jpg$2');
  }
  return value
    .replace(/\/video\/upload\//i, '/video/upload/so_0,f_jpg,q_auto/')
    .replace(/\.(mp4|mov|webm|m4v)(\?|$)/i, '.jpg$2');
}

/** Cover for outer listing cards: first photo, else saved thumb, else video start frame. */
export function listingThumbUri(
  listing: Pick<Listing, 'images' | 'thumbnailUrl' | 'videoUrl'>,
): string | undefined {
  const photo = listingPhotoUris(listing)[0];
  if (photo) return photo;
  const thumb = trimUri(listing.thumbnailUrl);
  if (thumb) return thumb;
  const video = listingVideoUrl(listing);
  return cloudinaryVideoFirstFrameUrl(video);
}
