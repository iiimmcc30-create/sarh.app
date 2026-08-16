import type { Listing } from '@/services/types';

export const LISTING_VIDEO_EXT = /\.(mp4|mov|webm|m4v|quicktime)(\?|$)/i;
const LISTING_VIDEO_HINT = /\/video\/|resource_type=video|\/videos\//i;
const LISTING_IMAGE_EXT = /\.(jpe?g|png|webp|gif)(\?|$)/i;

function trimUri(uri?: string | null): string | undefined {
  const value = typeof uri === 'string' ? uri.trim() : '';
  return value.length > 0 ? value : undefined;
}

/** Cloudinary (or derived) video still — image, not playable video. */
export function isListingVideoStillUri(uri?: string | null): boolean {
  const value = trimUri(uri);
  if (!value) return false;
  if (!/\/video\/upload\//i.test(value)) return false;
  if (/\/video\/upload\/[^/]*so_/i.test(value)) return true;
  if (/\/video\/upload\/[^/]*f_jpg/i.test(value)) return true;
  return LISTING_IMAGE_EXT.test(value);
}

/**
 * Ephemeral local-disk uploads (e.g. Render `/uploads/...`) that disappear
 * after restart — prefer Cloudinary/CDN covers over these on cards.
 */
export function isEphemeralListingUploadUri(uri?: string | null): boolean {
  const value = trimUri(uri);
  if (!value) return false;
  if (/res\.cloudinary\.com/i.test(value)) return false;
  return /\/uploads\//i.test(value);
}

export function isListingVideoUri(uri?: string | null): boolean {
  const value = trimUri(uri);
  if (!value) return false;
  if (isListingVideoStillUri(value)) return false;
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
  if (dedicated && !isListingVideoStillUri(dedicated)) return dedicated;
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

function firstDurableUri(uris: Array<string | undefined | null>): string | undefined {
  for (const uri of uris) {
    const value = trimUri(uri);
    if (value && !isEphemeralListingUploadUri(value)) return value;
  }
  return undefined;
}

/** Cover for outer listing cards: durable photo → thumb → video frame → any photo. */
export function listingThumbUri(
  listing: Pick<Listing, 'images' | 'thumbnailUrl' | 'videoUrl'>,
): string | undefined {
  const photos = listingPhotoUris(listing);
  const durablePhoto = firstDurableUri(photos);
  if (durablePhoto) return durablePhoto;

  const thumb = trimUri(listing.thumbnailUrl);
  if (thumb && !isEphemeralListingUploadUri(thumb)) return thumb;

  const videoFrame = cloudinaryVideoFirstFrameUrl(listingVideoUrl(listing));
  if (videoFrame) return videoFrame;

  return photos[0] ?? thumb;
}
