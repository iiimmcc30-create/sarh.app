import { UnifiedSearchService } from './unified-search.service';
import { UnifiedSearchRepository } from './repositories/unified-search.repository';

describe('UnifiedSearchService', () => {
  const repo = {
    searchListings: jest.fn(),
    searchPosts: jest.fn(),
    searchButchers: jest.fn(),
    searchNews: jest.fn(),
    searchServices: jest.fn(),
    searchUsers: jest.fn(),
    suggestPrefixes: jest.fn(),
  } as unknown as jest.Mocked<UnifiedSearchRepository>;

  const cache = {
    isEnabled: jest.fn().mockReturnValue(false),
    get: jest.fn(),
    set: jest.fn(),
  };

  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

  let service: UnifiedSearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UnifiedSearchService(repo, cache as never, logger as never);
  });

  it('returns grouped results for type=all', async () => {
    repo.searchListings.mockResolvedValue([
      {
        id: 'l1',
        title: 'Sheep',
        arabicTitle: 'غنم حري',
        description: '',
        arabicDescription: ' للبيع',
        price: 1000,
        currency: 'SAR',
        category: 'sheep',
        breed: 'حري',
        age: '',
        location: 'Dammam',
        arabicLocation: 'الدمام',
        country: 'SA',
        images: [],
        videoUrl: null,
        thumbnailUrl: null,
        featured: false,
        pinned: false,
        promoted: false,
        promotionWeight: 0,
        createdAt: new Date('2026-08-01'),
        seller: {
          id: 'u1',
          username: 'seller',
          displayName: 'Seller',
          arabicName: 'بائع',
          avatar: null,
          verified: false,
          country: 'SA',
        },
        marketCategory: null,
        marketSubcategory: null,
      },
    ]);
    repo.searchPosts.mockResolvedValue([]);
    repo.searchButchers.mockResolvedValue([]);
    repo.searchNews.mockResolvedValue([]);
    repo.searchServices.mockResolvedValue([]);

    const result = await service.search({ q: 'غنم حري', type: 'all' });

    expect(result.groups).toHaveLength(5);
    expect(result.groups[0].type).toBe('listings');
    expect(result.groups[0].items[0].title).toContain('غنم');
    expect(repo.searchListings).toHaveBeenCalled();
  });

  it('uses redis cache for suggestions when enabled', async () => {
    cache.isEnabled.mockReturnValue(true);
    cache.get.mockResolvedValue([{ text: 'ملاحم', kind: 'listing' }]);

    const result = await service.suggest('مل', 5);
    expect(result.suggestions).toEqual([{ text: 'ملاحم', kind: 'listing' }]);
    expect(repo.suggestPrefixes).not.toHaveBeenCalled();
  });
});
