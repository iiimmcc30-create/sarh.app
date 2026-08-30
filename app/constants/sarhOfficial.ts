/** Public Sarh identity — contact and share URLs. */
export const SARH_OFFICIAL_EMAIL = 'sarh@sarhsa.online';
export const SARH_OFFICIAL_SITE = 'https://sarhsa.online';
export const SARH_OFFICIAL_HOST = 'sarhsa.online';

export function sarhListingShareUrl(listingId: string): string {
  return `${SARH_OFFICIAL_SITE}/l/${listingId}`;
}

export function sarhProfileShareUrl(username: string): string {
  return `${SARH_OFFICIAL_SITE}/u/${username}`;
}
