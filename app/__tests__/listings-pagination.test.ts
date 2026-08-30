import { accumulateListingPages, mergeListingsById } from '@/lib/listingsPagination';
import { parseListingsSearchPage } from '@/services/listings';
import {
  SARH_OFFICIAL_EMAIL,
  SARH_OFFICIAL_HOST,
  SARH_OFFICIAL_SITE,
  sarhListingShareUrl,
  sarhProfileShareUrl,
} from '@/constants/sarhOfficial';
import { compareListingBoostPriority, interleavePromotedListings } from '@/lib/listingSort';
import type { Listing } from '@/services/types';

function fakeListing(id: string, extras: Partial<Listing> = {}): Listing {
  return {
    id,
    title: id,
    arabicTitle: id,
    price: 100,
    currency: 'SAR',
    category: 'equipment',
    breed: '',
    age: '',
    location: 'Riyadh',
    arabicLocation: 'الرياض',
    country: 'SA',
    images: [],
    description: '',
    arabicDescription: '',
    seller: {
      id: extras.seller?.id ?? 'seller-market',
      username: 'u',
      displayName: 'u',
      arabicName: 'u',
      verified: false,
      followers: 0,
      following: 0,
      rating: null,
      reviewCount: 0,
      country: 'SA',
      bio: '',
    },
    featured: false,
    pinned: false,
    promoted: false,
    postedAt: '2026-01-01',
    createdAt: extras.createdAt ?? '2026-01-01T00:00:00.000Z',
    ...extras,
  };
}

function pagesOf(total: number, pageSize = 20): Array<{
  listings: Listing[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const all = Array.from({ length: total }, (_, i) => fakeListing(`ad-${i + 1}`));
  const pages = [];
  for (let offset = 0; offset < all.length; offset += pageSize) {
    const listings = all.slice(offset, offset + pageSize);
    const hasMore = offset + pageSize < all.length;
    pages.push({
      listings,
      nextCursor: hasMore ? listings[listings.length - 1]?.id ?? null : null,
      hasMore,
    });
  }
  return pages;
}

describe('marketplace cursor pagination', () => {
  it('keeps page size 20 and reaches listing 21 / 50 / 100 across pages', () => {
    for (const total of [21, 50, 100]) {
      const pages = pagesOf(total, 20);
      expect(pages[0].listings).toHaveLength(20);
      expect(pages[0].hasMore).toBe(true);
      const collected = accumulateListingPages(pages);
      expect(collected).toHaveLength(total);
      expect(collected[20].id).toBe('ad-21');
      expect(collected[collected.length - 1].id).toBe(`ad-${total}`);
    }
  });

  it('does not drop search/sort/promoted ranking after merging pages', () => {
    const first = pagesOf(21, 20)[0].listings.map((l, i) =>
      fakeListing(l.id, { createdAt: `2026-01-${String(21 - i).padStart(2, '0')}T00:00:00.000Z` }),
    );
    first[3] = { ...first[3], promoted: true, promotionWeight: 10 };
    const second = [fakeListing('ad-21', { createdAt: '2026-01-01T00:00:00.000Z' })];
    const merged = mergeListingsById(first, second);
    const sorted = [...merged].sort(compareListingBoostPriority);
    const ranked = interleavePromotedListings(sorted);
    expect(ranked.some((l) => l.id === 'ad-21')).toBe(true);
    expect(ranked.some((l) => l.promoted)).toBe(true);
  });
});

describe('my listings are independent of the market first page', () => {
  it('does not use the market slice to hide a seller listing past #20', () => {
    const marketPage = pagesOf(20, 20)[0].listings;
    const mine = [
      fakeListing('mine-21', { seller: { ...fakeListing('x').seller, id: 'me' } }),
    ];
    const fromMarket = marketPage.filter((l) => l.seller.id === 'me');
    expect(fromMarket).toHaveLength(0);
    const sellerPage = { listings: mine, nextCursor: null, hasMore: false };
    expect(accumulateListingPages([sellerPage])).toHaveLength(1);
    expect(sellerPage.listings[0].id).toBe('mine-21');
  });

  it('paginates a seller with 21+ listings', () => {
    const mine = Array.from({ length: 21 }, (_, i) =>
      fakeListing(`mine-${i + 1}`, { seller: { ...fakeListing('x').seller, id: 'me' } }),
    );
    const page1 = { listings: mine.slice(0, 20), nextCursor: 'mine-20', hasMore: true };
    const page2 = { listings: mine.slice(20), nextCursor: null, hasMore: false };
    const collected = accumulateListingPages([page1, page2]);
    expect(collected).toHaveLength(21);
    expect(collected[20].id).toBe('mine-21');
  });
});

describe('parseListingsSearchPage', () => {
  const sample = {
    id: 'l1',
    title: 'Sheep',
    arabicTitle: 'أغنام',
    price: 10,
    category: 'equipment',
    location: 'Riyadh',
    arabicLocation: 'الرياض',
    country: 'SA',
    description: 'd',
    arabicDescription: 'د',
    createdAt: '2026-01-01T00:00:00.000Z',
    seller: { id: 's1', username: 's', country: 'SA' },
  };

  it('keeps nextCursor and hasMore from the API', () => {
    const page = parseListingsSearchPage({
      success: true,
      data: { listings: [sample], nextCursor: 'l1', hasMore: true },
    });
    expect(page.listings).toHaveLength(1);
    expect(page.nextCursor).toBe('l1');
    expect(page.hasMore).toBe(true);
  });

  it('does not treat a missing cursor as more pages', () => {
    const page = parseListingsSearchPage({
      success: true,
      data: { listings: [sample], nextCursor: null, hasMore: true },
    });
    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeNull();
  });
});

describe('Sarh official identity', () => {
  it('uses sarh@sarhsa.online and sarhsa.online', () => {
    expect(SARH_OFFICIAL_EMAIL).toBe('sarh@sarhsa.online');
    expect(SARH_OFFICIAL_HOST).toBe('sarhsa.online');
    expect(SARH_OFFICIAL_SITE).toBe('https://sarhsa.online');
    expect(sarhListingShareUrl('abc')).toBe('https://sarhsa.online/l/abc');
    expect(sarhProfileShareUrl('user')).toBe('https://sarhsa.online/u/user');
  });
});
