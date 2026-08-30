import { ListingsService } from './listings.service';

function listingRow(id: string, createdAt: Date) {
  return {
    id,
    pinned: false,
    featured: false,
    promoted: false,
    promotionWeight: 0,
    createdAt,
    images: [],
    thumbnailUrl: null,
    videoUrl: null,
    seller: { verified: false, avatar: null, subscription: null },
  };
}

function makeStore(total: number) {
  return Array.from({ length: total }, (_, i) =>
    listingRow(
      `l${String(i + 1).padStart(3, '0')}`,
      new Date(Date.UTC(2026, 0, 1, 12, 0, total - i)),
    ),
  );
}

describe('ListingsService.list pagination', () => {
  const cache = { get: jest.fn().mockResolvedValue(null), set: jest.fn(), del: jest.fn(), delPattern: jest.fn() };
  const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
  const promotions = { expireStalePromotions: jest.fn().mockResolvedValue(undefined) };
  const planResolver = { resolveSync: jest.fn().mockReturnValue(null) };
  const planPermissions = { priorityBoost: jest.fn().mockReturnValue(0) };

  function serviceWithStore(store: ReturnType<typeof makeStore>) {
    const repo = {
      findMany: jest.fn(async ({ take, cursor }: { take: number; cursor?: string }) => {
        let start = 0;
        if (cursor) {
          const idx = store.findIndex((row) => row.id === cursor);
          start = idx >= 0 ? idx + 1 : 0;
        }
        return store.slice(start, start + take);
      }),
    };
    return new ListingsService(
      repo as never,
      {} as never,
      cache as never,
      logger as never,
      {} as never,
      {} as never,
      {} as never,
      planResolver as never,
      planPermissions as never,
      promotions as never,
      {} as never,
      {} as never,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    cache.get.mockResolvedValue(null);
  });

  it.each([21, 50, 100])(
    'pages through %s listings at 20 per page without dropping items after 20',
    async (total) => {
      const store = makeStore(total);
      const service = serviceWithStore(store);
      const collected: string[] = [];
      let cursor: string | undefined;
      let pages = 0;
      let hasMore = true;

      while (hasMore) {
        pages += 1;
        const result = await service.list({ cursor } as never);
        expect(result.listings.length).toBeLessThanOrEqual(20);
        collected.push(...result.listings.map((row: { id: string }) => row.id));
        hasMore = result.hasMore;
        cursor = result.nextCursor ?? undefined;
        if (pages > 20) break;
      }

      expect(pages).toBe(Math.ceil(total / 20));
      expect(collected).toHaveLength(total);
      expect(collected[20]).toBe('l021');
      expect(new Set(collected).size).toBe(total);
    },
  );

  it('filters seller listings independently of the market feed', async () => {
    const store = makeStore(40).map((row, i) => ({
      ...row,
      sellerId: i >= 20 ? 'seller-a' : 'other',
    }));
    const repo = {
      findMany: jest.fn(async ({ where, take }: { where: { sellerId?: string }; take: number }) => {
        const filtered = store.filter((row) =>
          where.sellerId ? (row as { sellerId: string }).sellerId === where.sellerId : true,
        );
        return filtered.slice(0, take);
      }),
    };
    const service = new ListingsService(
      repo as never,
      {} as never,
      cache as never,
      logger as never,
      {} as never,
      {} as never,
      {} as never,
      planResolver as never,
      planPermissions as never,
      promotions as never,
      {} as never,
      {} as never,
    );

    const market = await service.list({} as never);
    expect(market.listings).toHaveLength(20);
    expect(market.hasMore).toBe(true);

    const mine = await service.list({ sellerId: 'seller-a' } as never);
    expect(mine.listings).toHaveLength(20);
    expect(mine.listings.every((row: { id: string }) => row.id >= 'l021')).toBe(true);
  });

});
