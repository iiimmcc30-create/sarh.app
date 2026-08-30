import {
  SARH_OFFICIAL_EMAIL,
  SARH_OFFICIAL_HOST,
  SARH_OFFICIAL_SITE,
  sarhListingShareUrl,
  sarhProfileShareUrl,
} from '@/constants/sarhOfficial';

describe('Sarh official identity', () => {
  it('uses sarh@sarhsa.online and sarhsa.online', () => {
    expect(SARH_OFFICIAL_EMAIL).toBe('sarh@sarhsa.online');
    expect(SARH_OFFICIAL_HOST).toBe('sarhsa.online');
    expect(SARH_OFFICIAL_SITE).toBe('https://sarhsa.online');
    expect(sarhListingShareUrl('abc')).toBe('https://sarhsa.online/l/abc');
    expect(sarhProfileShareUrl('user')).toBe('https://sarhsa.online/u/user');
  });
});
