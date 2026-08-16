/** Shared @IsUrl options — allow localhost/dev URLs used by local storage uploads */
export const MEDIA_URL_OPTS = {
  require_tld: false,
  protocols: ['http', 'https'] as ('http' | 'https')[],
};

const LISTING_VIDEO_EXT = /\.(mp4|mov|webm|m4v|quicktime)(\?|$)/i;
const LISTING_VIDEO_HINT = /\/video\/|resource_type=video|\/videos\//i;
const LISTING_IMAGE_EXT = /\.(jpe?g|png|webp|gif)(\?|$)/i;

/** Cloudinary derived still from a video — image delivery, not playable video. */
export function isListingVideoStillUrl(url?: string | null): boolean {
  if (typeof url !== 'string') return false;
  const value = url.trim();
  if (!value) return false;
  if (!/\/video\/upload\//i.test(value)) return false;
  if (/\/video\/upload\/[^/]*so_/i.test(value)) return true;
  if (/\/video\/upload\/[^/]*f_jpg/i.test(value)) return true;
  return LISTING_IMAGE_EXT.test(value);
}

export function isListingVideoUrl(url?: string | null): boolean {
  if (typeof url !== 'string') return false;
  const value = url.trim();
  if (!value) return false;
  if (isListingVideoStillUrl(value)) return false;
  return LISTING_VIDEO_EXT.test(value) || LISTING_VIDEO_HINT.test(value);
}

export function extractListingVideoUrl(
  videoUrl?: string | null,
  images?: string[] | null,
): string | null {
  const dedicated = typeof videoUrl === 'string' ? videoUrl.trim() : '';
  if (dedicated && !isListingVideoStillUrl(dedicated)) return dedicated;
  const fromImages = (images ?? []).find((uri) => isListingVideoUrl(uri));
  return fromImages ?? null;
}
