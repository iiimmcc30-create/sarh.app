import { PaymentsRepository } from './payments.repository';

describe('PaymentsRepository payment-safety transitions', () => {
  const tx = {
    payment: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    butcherOrder: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const prisma = {
    payment: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
  };

  const repo = new PaymentsRepository(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (fn) => fn(tx));
  });

  it('markPaymentFailedById only updates pending rows (paid stays paid)', async () => {
    prisma.payment.updateMany.mockResolvedValue({ count: 0 });

    const result = await repo.markPaymentFailedById('pay-paid');

    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: { id: 'pay-paid', status: 'pending' },
      data: { status: 'failed' },
    });
    expect(result).toEqual({ count: 0 });
  });

  it('markPaymentFailedById updates a pending payment', async () => {
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });

    const result = await repo.markPaymentFailedById('pay-pending');

    expect(result).toEqual({ count: 1 });
  });

  it('records NI capture on a cancelled butcher order without fulfilling it', async () => {
    tx.butcherOrder.findUnique.mockResolvedValue({
      id: 'ord-1',
      status: 'cancelled',
    });
    tx.payment.findUnique.mockResolvedValue({
      status: 'failed',
      metadata: { type: 'butcher_order' },
    });
    tx.payment.updateMany.mockResolvedValue({ count: 1 });

    const result = await repo.processSuccessfulPayment({
      paymentId: 'pay-late',
      niTransactionId: 'ni-cap',
      type: 'butcher_order',
      referenceId: 'ord-1',
      userId: 'u1',
      targetPlanId: undefined,
      billingCycle: 'monthly',
      storedMeta: { type: 'butcher_order' },
    });

    expect(result).toEqual({
      processed: false,
      capturedAfterCancel: true,
    });
    expect(tx.butcherOrder.update).not.toHaveBeenCalled();
    expect(tx.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'pay-late',
          status: { in: ['pending', 'failed'] },
        },
        data: expect.objectContaining({
          status: 'paid',
          transactionId: 'ni-cap',
        }),
      }),
    );
  });

  it('sets ButcherOrder.paymentStatus to refunded with the payment (idempotent)', async () => {
    tx.payment.findUnique.mockResolvedValue({
      id: 'pay-1',
      status: 'paid',
      metadata: {},
      referenceType: 'butcher_order',
      referenceId: 'ord-1',
    });
    tx.payment.updateMany.mockResolvedValue({ count: 1 });
    tx.butcherOrder.updateMany.mockResolvedValue({ count: 1 });

    const first = await repo.markPaymentRefunded('pay-1', {
      refundedAt: 'now',
    });
    expect(first).toEqual({
      id: 'pay-1',
      status: 'refunded',
      newlyRefunded: true,
    });
    expect(tx.butcherOrder.updateMany).toHaveBeenCalledWith({
      where: { id: 'ord-1', paymentStatus: { not: 'refunded' } },
      data: { paymentStatus: 'refunded' },
    });

    tx.payment.findUnique.mockResolvedValue({
      id: 'pay-1',
      status: 'refunded',
      metadata: {},
      referenceType: 'butcher_order',
      referenceId: 'ord-1',
    });
    tx.payment.updateMany.mockClear();
    tx.butcherOrder.updateMany.mockResolvedValue({ count: 0 });

    const second = await repo.markPaymentRefunded('pay-1', {
      refundedAt: 'now',
    });
    expect(second).toEqual({
      id: 'pay-1',
      status: 'refunded',
      newlyRefunded: false,
    });
    expect(tx.payment.updateMany).not.toHaveBeenCalled();
    expect(tx.butcherOrder.updateMany).toHaveBeenCalled();
  });

  it('markOrderCommissionRefunded is a no-op when already reversed', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);

    const result = await repo.markOrderCommissionRefunded('ord-1', {
      refundedAt: 'now',
    });

    expect(result).toBeNull();
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });
});
