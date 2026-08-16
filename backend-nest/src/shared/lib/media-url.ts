/** Shared @IsUrl options — allow localhost/dev URLs used by local storage uploads */
export const MEDIA_URL_OPTS = {
  require_tld: false,
  protocols: ['http', 'https'] as ('http' | 'https')[],
};

const LISTING_VIDEO_EXT = /\.(mp4|mov|webm|m4v|quicktime)(\?|$)/i;
const LISTING_VIDEO_HINT = /\/video\/|resource_type=video|\/videos\//i;

export function isListingVideoUrl(url?: string | null): boolean {
  if (typeof url !== 'string') return false;
  const value = url.trim();
  if (!value) return false;
  return LISTING_VIDEO_EXT.test(value) || LISTING_VIDEO_HINT.test(value);
}

export function extractListingVideoUrl(
  videoUrl?: string | null,
  images?: string[] | null,
): string | null {
  const dedicated = typeof videoUrl === 'string' ? videoUrl.trim() : '';
  if (dedicated) return dedicated;
  const fromImages = (images ?? []).find((uri) => isListingVideoUrl(uri));
  return fromImages ?? null;
}
