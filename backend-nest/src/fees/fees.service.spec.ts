import { FeesService } from './fees.service';

describe('FeesService.quoteForOwner', () => {
  const prisma = {
    listingFee: {
      findFirst: jest.fn(),
    },
  };

  const service = new FeesService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('computes 10000 → 100 for the owner only', async () => {
    prisma.listingFee.findFirst.mockResolvedValue({
      id: 'fee-1',
      status: 'pending',
      listingId: 'l1',
    });

    const quote = await service.quoteForOwner('u1', 'l1', 10000);
    expect(quote.commission).toBe(100);
    expect(quote.ratePercent).toBe(1);
    expect(prisma.listingFee.findFirst).toHaveBeenCalledWith({
      where: { listingId: 'l1', userId: 'u1' },
      select: { id: true, status: true, listingId: true },
    });
  });

  it('rejects another user quoting someone else\'s listing', async () => {
    prisma.listingFee.findFirst.mockResolvedValue(null);
    await expect(service.quoteForOwner('eve', 'l1', 10000)).rejects.toMatchObject({
      error: 'fee_not_found',
    });
  });
});
