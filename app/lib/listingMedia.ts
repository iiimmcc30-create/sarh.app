import type { Listing } from '@/services/types';

export const LISTING_VIDEO_EXT = /\.(mp4|mov|webm|m4v|quicktime)(\?|$)/i;
const LISTING_VIDEO_HINT = /\/video\/|resource_type=video|\/videos\//i;
const LISTING_IMAGE_EXT = /\.(jpe?g|png|webp|gif)(\?|$)/i;

function trimUri(uri?: string | null): string | undefined {
  const value = typeof uri === 'string' ? uri.trim() : '';
  return value.length > 0 ? value : undefined;
}

/** List-card delivery: ~118px CSS thumb × 2x DPR, crop-fill, auto format/quality. */
export const LISTING_LIST_THUMB_TRANSFORM = 'w_240,c_fill,q_auto,f_auto';

const CLOUDINARY_UPLOAD =
  /^((?:https?:\/\/)?res\.cloudinary\.com\/[^/]+\/(?:image|video)\/upload\/)(.+)$/i;

export const CLOUDINARY_FIT = {
  /** 46–92px rows (search, nearby logo, product tile, map pin). */
  row: ['w_200', 'c_fill', 'q_auto', 'f_auto'],
  /** Listing cards (~118px CSS). */
  list: ['w_240', 'c_fill', 'q_auto', 'f_auto'],
  /** Medium cards (~130–160px). */
  card: ['w_480', 'c_fill', 'q_auto', 'f_auto'],
  /** Full-width banners / news list (~168px tall). */
  wide: ['w_800', 'c_fill', 'q_auto', 'f_auto'],
} as const;

export type CloudinaryFit = keyof typeof CLOUDINARY_FIT;

function cloudinaryTokenPrefix(token: string): string {
  return token.split('_')[0] ?? token;
}

function isCloudinaryTransformSegment(segment: string): boolean {
  if (!segment || segment.includes('.')) return false;
  if (/^v\d+$/.test(segment)) return false;
  return /[_:,]/.test(segment);
}

function mergeCloudinaryTransformTokens(existing: string, extras: readonly string[]): string {
  const current = existing
    .split(/[,/]/)
    .map((token) => token.trim())
    .filter(Boolean);
  const prefixes = new Set(current.map(cloudinaryTokenPrefix));
  const toAdd = extras.filter((token) => !prefixes.has(cloudinaryTokenPrefix(token)));
  return [...toAdd, ...current].join(',');
}

/**
 * Resize Cloudinary delivery URLs for list/card thumbs. Leaves non-Cloudinary
 * URLs, missing values, and already-width-transformed URLs unchanged (no duplicate w_/q_/f_).
 * Does not rewrite stored media — callers keep the original on the model.
 */
export function cloudinaryFitUrl(
  uri?: string | null,
  fit: CloudinaryFit = 'list',
): string | undefined {
  const value = trimUri(uri);
  if (!value) return undefined;
  if (!/res\.cloudinary\.com/i.test(value)) return value;

  const match = value.match(CLOUDINARY_UPLOAD);
  if (!match) return value;

  let rest = match[2];
  let query = '';
  const queryAt = rest.indexOf('?');
  if (queryAt >= 0) {
    query = rest.slice(queryAt);
    rest = rest.slice(0, queryAt);
  }

  const parts = rest.split('/').filter(Boolean);
  const transformSegs: string[] = [];
  let index = 0;
  for (; index < parts.length; index += 1) {
    const part = parts[index];
    if (/^v\d+$/.test(part) || !isCloudinaryTransformSegment(part)) break;
    transformSegs.push(part);
  }
  const resource = parts.slice(index).join('/');
  if (!resource) return value;

  const merged = mergeCloudinaryTransformTokens(transformSegs.join(','), CLOUDINARY_FIT[fit]);
  return `${match[1]}${merged}/${resource}${query}`;
}

export function cloudinaryListThumbUrl(uri?: string | null): string | undefined {
  return cloudinaryFitUrl(uri, 'list');
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
  const photos = (listing.images ?? []).filter((uri) => {
    const value = trimUri(uri);
    return !!value && !isListingVideoUri(value);
  });
  const durable = photos.filter((uri) => !isEphemeralListingUploadUri(uri));
  return durable;
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

function listingThumbSource(
  listing: Pick<Listing, 'images' | 'thumbnailUrl' | 'videoUrl'>,
): string | undefined {
  const photos = listingPhotoUris(listing);
  const durablePhoto = firstDurableUri(photos);
  if (durablePhoto) return durablePhoto;

  const thumb = trimUri(listing.thumbnailUrl);
  if (thumb && !isEphemeralListingUploadUri(thumb)) return thumb;

  const videoFrame = cloudinaryVideoFirstFrameUrl(listingVideoUrl(listing));
  if (videoFrame) return videoFrame;

  if (photos[0] && !isEphemeralListingUploadUri(photos[0])) return photos[0];
  if (thumb && !isEphemeralListingUploadUri(thumb)) return thumb;
  return undefined;
}

/** Cover for outer listing cards: durable photo → thumb → video frame → any photo. */
export function listingThumbUri(
  listing: Pick<Listing, 'images' | 'thumbnailUrl' | 'videoUrl'>,
): string | undefined {
  return cloudinaryListThumbUrl(listingThumbSource(listing));
}
