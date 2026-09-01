import { DaftraService } from './daftra.service';

describe('DaftraService', () => {
  const prev = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'x'.repeat(32);
  });

  afterAll(() => {
    process.env.JWT_SECRET = prev;
  });

  function setup(overrides: Record<string, unknown> = {}) {
    const prisma = {
      butcher: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'butcher-1',
          sourceApplicationId: 'app-1',
        }),
      },
      butcherDaftraIntegration: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({}),
      ),
    };
    const emailQueue = { addEmail: jest.fn() };
    const logger = { info: jest.fn(), warn: jest.fn() };
    Object.assign(prisma, overrides);
    const service = new DaftraService(
      prisma as never,
      emailQueue as never,
      logger as never,
    );
    return { service, prisma, emailQueue };
  }

  it('returns NOT_CONFIGURED when no row exists', async () => {
    const { service } = setup();
    const status = await service.getStatus('butcher-1');
    expect(status.status).toBe('NOT_CONFIGURED');
    expect(status.apiKeyMasked).toBeNull();
    expect(JSON.stringify(status)).not.toMatch(/apiKeyCiphertext|SUPER/);
  });

  it('rejects missing butcher (no IDOR create)', async () => {
    const { service, prisma } = setup();
    prisma.butcher.findUnique.mockResolvedValue(null);
    await expect(
      service.configure('admin-1', 'missing', {
        accountIdentifier: 'shop1',
        apiKey: '1234567890abcdef',
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
