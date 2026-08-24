import { Test } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './repositories/payments.repository';
import { LoggerService } from '../common/services/logger.service';
import { AppNotificationsService } from '../queue/services/app-notifications.service';
import { SubscriptionCacheService } from '../subscriptions/services/subscription-cache.service';
import { SubscriptionLifecycleService } from '../subscriptions/services/subscription-lifecycle.service';
import { SubscriptionEntitlementService } from '../subscriptions/services/subscription-entitlement.service';
import { RedisCacheService } from '../redis/services/redis-cache.service';
import { PlansService } from '../plans/plans.service';
import { PaidServicesService } from '../settings/paid-services.service';
import { IntegrationCheckoutService } from '../integrations/services/integration-checkout.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const repo = {
    findSubscriptionForPayment: jest.fn(),
    findPendingFee: jest.fn(),
    findUnpaidButcherOrder: jest.fn(),
    findOwnedListingForCommission: jest.fn(),
    findUserContact: jest.fn().mockResolvedValue({
      displayName: 'User',
      arabicName: 'مستخدم',
      email: 'u@example.com',
    }),
    createPendingPaymentOrReturnExisting: jest.fn(),
    createPendingPayment: jest.fn(),
    archiveInvalidPendingPayment: jest.fn(),
    markPaymentFailed: jest.fn(),
    updatePaymentCheckout: jest.fn(),
    findPaymentByIdFull: jest.fn(),
    findPaymentOwnedByUser: jest.fn(),
  };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const notifications = {
    notifyUser: jest.fn(),
    notifyUsers: jest.fn(),
  };
  const subscriptionCache = { invalidate: jest.fn() };
  const subscriptionLifecycle = {
    shouldBlockPayment: jest.fn().mockReturnValue(false),
    notifyRenewalSuccess: jest.fn(),
    notifyRenewalFailed: jest.fn(),
    downgradeUser: jest.fn(),
  };
  const entitlements = {
    getAudienceForUser: jest.fn().mockResolvedValue('USER'),
  };
  const plans = {
    getUpgradablePlans: jest.fn().mockReturnValue(['sarh-pro']),
    getPlanPrice: jest.fn().mockReturnValue(100),
  };
  const cache = { delPattern: jest.fn(), del: jest.fn() };
  const paidServices = {
    assertListingFeesEnabled: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PaymentsRepository, useValue: repo },
        { provide: LoggerService, useValue: logger },
        { provide: AppNotificationsService, useValue: notifications },
        { provide: SubscriptionCacheService, useValue: subscriptionCache },
        {
          provide: SubscriptionLifecycleService,
          useValue: subscriptionLifecycle,
        },
        { provide: SubscriptionEntitlementService, useValue: entitlements },
        { provide: PlansService, useValue: plans },
        { provide: RedisCacheService, useValue: cache },
        { provide: PaidServicesService, useValue: paidServices },
        {
          provide: IntegrationCheckoutService,
          useValue: {
            createHostedCheckout: jest.fn().mockResolvedValue({
              checkoutUrl: 'https://checkout.example/pay',
              externalOrderId: 'a13f81f3-27b4-48b6-88de-22b9ddc1e1dc',
              merchantOrderReference: 'SFAT-U1-TEST',
              reused: false,
              mock: true,
            }),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
  });

  it('requires a listing reference for commission payments', async () => {
    await expect(
      service.initiate(
        { userId: 'u1', role: 'USER' } as never,
        { amount: 25, method: 'visa', type: 'commission' } as never,
      ),
    ).rejects.toMatchObject({ error: 'ref_required', status: 400 });
  });

  it('rejects commission payment when the listing is not owned by the caller', async () => {
    repo.findOwnedListingForCommission.mockResolvedValue(null);

    await expect(
      service.initiate(
        { userId: 'u1', role: 'USER' } as never,
        {
          amount: 25,
          method: 'visa',
          type: 'commission',
          referenceId: 'listing-b',
        } as never,
      ),
    ).rejects.toMatchObject({ error: 'listing_not_found', status: 404 });
  });

  it('allows commission payment for an owned listing without forcing the amount', async () => {
    repo.findOwnedListingForCommission.mockResolvedValue({
      id: 'listing-a',
      status: 'sold',
      fee: {
        id: 'fee-a',
        status: 'pending',
        commission: 100,
        dueDate: new Date(),
      },
    });
    repo.createPendingPaymentOrReturnExisting.mockResolvedValue({
      payment: { id: 'pay-1', orderId: 'SFAT-U1-TEST' },
    });
    jest.spyOn(service as any, 'createCheckoutForPayment').mockResolvedValue({
      paymentId: 'pay-1',
      orderId: 'SFAT-U1-TEST',
      checkoutUrl: 'https://checkout.example/pay-1',
      status: 'pending',
      devMode: true,
    } as never);

    const result = await service.initiate(
      { userId: 'u1', role: 'USER' } as never,
      {
        amount: 25,
        method: 'visa',
        type: 'commission',
        referenceId: 'listing-a',
      } as never,
    );

    expect(repo.findOwnedListingForCommission).toHaveBeenCalledWith(
      'listing-a',
      'u1',
    );
    expect(result.paymentId).toBe('pay-1');
  });

  it('returns 500 when a verified webhook fails during processing', async () => {
    jest
      .spyOn(service as any, 'handleNIWebhook')
      .mockRejectedValue(new Error('boom'));

    const result = await service.processWebhook(
      JSON.stringify({ eventName: 'ORDER.PAID', order: { reference: 'x' } }),
    );

    expect(result).toEqual({
      status: 500,
      body: { error: 'webhook_processing_failed' },
    });
  });

  it('does not call NI sync when only internal merchant ref exists', async () => {
    const prevKey = process.env.NI_API_KEY;
    process.env.NI_API_KEY = 'live_ci_test_key_not_mock';
    try {
      repo.findPaymentOwnedByUser.mockResolvedValue({
        id: 'pay-ftr',
        status: 'pending',
        orderId: 'FTR-4916FD-MSPXSTSH',
        transactionId: null,
      });
      repo.findPaymentByIdFull.mockResolvedValue({
        id: 'pay-ftr',
        status: 'pending',
        orderId: 'FTR-4916FD-MSPXSTSH',
        transactionId: null,
      });

      const result = await service.syncPayment(
        { userId: 'u1', role: 'USER' } as never,
        'pay-ftr',
      );

      expect(result).toMatchObject({
        paymentId: 'pay-ftr',
        status: 'pending',
        synced: false,
        outcome: 'processing',
      });
      expect(result.messageAr).toContain('N-Genius');
    } finally {
      if (prevKey === undefined) delete process.env.NI_API_KEY;
      else process.env.NI_API_KEY = prevKey;
    }
  });

  it('recovers a stale pending payment that never received a checkout URL', async () => {
    repo.findOwnedListingForCommission.mockResolvedValue({
      id: 'listing-a',
      status: 'active',
      fee: null,
    });
    repo.createPendingPaymentOrReturnExisting.mockResolvedValue({
      existingPending: {
        id: 'pay-stuck',
        checkoutUrl: null,
        orderId: 'SFAT-STUCK',
        transactionId: null,
        createdAt: new Date(Date.now() - 3 * 60 * 1000),
      },
    });
    repo.archiveInvalidPendingPayment.mockResolvedValue({ id: 'pay-stuck' });
    repo.createPendingPayment.mockResolvedValue({
      id: 'pay-fresh',
      orderId: 'SFAT-FRESH',
    });
    jest.spyOn(service as any, 'createCheckoutForPayment').mockResolvedValue({
      paymentId: 'pay-fresh',
      orderId: 'SFAT-FRESH',
      checkoutUrl: 'https://checkout.example/pay-fresh',
      status: 'pending',
      devMode: true,
    } as never);

    const result = await service.initiate(
      { userId: 'u1', role: 'USER' } as never,
      {
        amount: 25,
        method: 'visa',
        type: 'commission',
        referenceId: 'listing-a',
      } as never,
    );

    expect(repo.archiveInvalidPendingPayment).toHaveBeenCalledWith(
      'pay-stuck',
      'ni_order_invalid_or_expired',
      { supersededBy: 'new_ni_order' },
    );
    expect(repo.createPendingPayment).toHaveBeenCalled();
    expect(result.paymentId).toBe('pay-fresh');
    expect(repo.findPaymentByIdFull).not.toHaveBeenCalled();
  });

  it('rejects butcher-order payment for another customer', async () => {
    repo.findUnpaidButcherOrder.mockResolvedValue(null);

    await expect(
      service.initiate(
        { userId: 'stranger', role: 'USER' } as never,
        {
          amount: 100,
          method: 'mada',
          type: 'butcher_order',
          referenceId: 'ord-1',
        } as never,
      ),
    ).rejects.toMatchObject({ error: 'order_not_found', status: 404 });

    expect(repo.findUnpaidButcherOrder).toHaveBeenCalledWith(
      'ord-1',
      'stranger',
    );
    expect(repo.createPendingPaymentOrReturnExisting).not.toHaveBeenCalled();
  });

  it('rejects butcher-order payment when the order is no longer payable', async () => {
    repo.findUnpaidButcherOrder.mockResolvedValue(null);

    await expect(
      service.initiate(
        { userId: 'u1', role: 'USER' } as never,
        {
          amount: 100,
          method: 'mada',
          type: 'butcher_order',
          referenceId: 'ord-cancelled',
        } as never,
      ),
    ).rejects.toMatchObject({ error: 'order_not_found', status: 404 });
  });

  it('archives a previous pending butcher payment and creates a new NI attempt', async () => {
    repo.findUnpaidButcherOrder.mockResolvedValue({
      id: 'ord-1',
      totalPrice: 100,
      currency: 'SAR',
      orderNumber: 'ORD-1',
      butcherId: 'b1',
      status: 'pending',
      paymentStatus: 'unpaid',
    });
    repo.createPendingPaymentOrReturnExisting.mockResolvedValue({
      existingPending: {
        id: 'pay-old',
        checkoutUrl: 'https://ni.example/old-session',
        orderId: 'SFAT-OLD',
        transactionId: 'a13f81f3-27b4-48b6-88de-22b9ddc1e1dc',
        createdAt: new Date(),
      },
    });
    repo.archiveInvalidPendingPayment.mockResolvedValue({ id: 'pay-old' });
    repo.createPendingPayment.mockResolvedValue({
      id: 'pay-new',
      orderId: 'SFAT-NEW',
    });
    const reuseSpy = jest
      .spyOn(service as any, 'tryReuseExistingPendingPayment')
      .mockResolvedValue({
        paymentId: 'pay-old',
        checkoutUrl: 'https://ni.example/old-session',
        status: 'pending',
        devMode: true,
      });
    jest.spyOn(service as any, 'createCheckoutForPayment').mockResolvedValue({
      paymentId: 'pay-new',
      orderId: 'SFAT-NEW',
      checkoutUrl: 'https://checkout.example/new',
      status: 'pending',
      devMode: true,
    } as never);

    const result = await service.initiate(
      { userId: 'u1', role: 'USER' } as never,
      {
        amount: 100,
        method: 'mada',
        type: 'butcher_order',
        referenceId: 'ord-1',
      } as never,
    );

    expect(reuseSpy).not.toHaveBeenCalled();
    expect(repo.archiveInvalidPendingPayment).toHaveBeenCalledWith(
      'pay-old',
      'ni_order_invalid_or_expired',
      { supersededBy: 'new_ni_order' },
    );
    expect(repo.createPendingPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        referenceId: 'ord-1',
        referenceType: 'butcher_order',
        amount: 100,
      }),
    );
    expect(result.paymentId).toBe('pay-new');
  });

  it('retries a butcher order whose previous Payment failed while the order stays unpaid', async () => {
    repo.findUnpaidButcherOrder.mockResolvedValue({
      id: 'ord-1',
      totalPrice: 80,
      currency: 'SAR',
      orderNumber: 'ORD-1',
      butcherId: 'b1',
      status: 'pending',
      paymentStatus: 'failed',
    });
    repo.createPendingPaymentOrReturnExisting.mockResolvedValue({
      payment: { id: 'pay-retry', orderId: 'SFAT-RETRY' },
    });
    jest.spyOn(service as any, 'createCheckoutForPayment').mockResolvedValue({
      paymentId: 'pay-retry',
      orderId: 'SFAT-RETRY',
      checkoutUrl: 'https://checkout.example/retry',
      status: 'pending',
      devMode: true,
    } as never);

    const result = await service.initiate(
      { userId: 'u1', role: 'USER' } as never,
      {
        amount: 80,
        method: 'mada',
        type: 'butcher_order',
        referenceId: 'ord-1',
      } as never,
    );

    expect(result.paymentId).toBe('pay-retry');
    expect(repo.findUnpaidButcherOrder).toHaveBeenCalledWith('ord-1', 'u1');
  });
});
