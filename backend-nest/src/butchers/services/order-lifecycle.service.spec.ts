import { Test } from '@nestjs/testing';
import { OrderLifecycleService } from './order-lifecycle.service';
import { OrderStateMachineService } from './order-state-machine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppNotificationsService } from '../../queue/services/app-notifications.service';
import { SocketEmitService } from '../../gateway/services/socket-emit.service';
import { ButcherRankingService } from './butcher-ranking.service';
import { ApiException } from '../../common/exceptions/api.exception';

describe('OrderLifecycleService', () => {
  let service: OrderLifecycleService;
  const prisma = {
    $transaction: jest.fn(),
    user: { findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }]) },
  };
  const notifications = {
    notifyUser: jest.fn().mockResolvedValue(undefined),
    notifyUsers: jest.fn().mockResolvedValue(undefined),
  };
  const sockets = {
    emitToUser: jest.fn(),
    getServer: jest.fn().mockReturnValue({ emit: jest.fn() }),
  };
  const ranking = {
    onOrderCancelled: jest.fn().mockResolvedValue(undefined),
    onOrderDelivered: jest.fn().mockResolvedValue(undefined),
  };

  const lockedRow = {
    id: 'order-1',
    orderNumber: 'ORD-2026-000001',
    status: 'pending' as const,
    paymentStatus: 'paid' as const,
    productId: 'p1',
    customerId: 'c1',
    reservedQuantity: 2,
    butcherId: 'b1',
    butcherUserId: 'butcher-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderLifecycleService,
        OrderStateMachineService,
        { provide: PrismaService, useValue: prisma },
        { provide: AppNotificationsService, useValue: notifications },
        { provide: SocketEmitService, useValue: sockets },
        { provide: ButcherRankingService, useValue: ranking },
      ],
    }).compile();

    service = moduleRef.get(OrderLifecycleService);
  });

  function transitionTx(overrides: {
    inventoryItems?: Array<{ productId: string; reservedQuantity: number }>;
    nextStatus?: string;
  } = {}) {
    const executeRaw = jest.fn().mockResolvedValue(1);
    const orderUpdate = jest.fn().mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-2026-000001',
      status: overrides.nextStatus ?? 'cancelled',
      butcher: { id: 'b1', userId: 'butcher-1' },
    });
    const timelineCreate = jest.fn().mockResolvedValue({
      status: overrides.nextStatus ?? 'cancelled',
      note: 'المنتج غير متوفر',
      createdAt: new Date(),
    });

    return {
      $queryRaw: jest.fn().mockResolvedValue([lockedRow]),
      butcherOrderItem: {
        findMany: jest.fn().mockResolvedValue(overrides.inventoryItems ?? []),
      },
      butcherOrder: {
        findUnique: jest.fn(),
        update: orderUpdate,
      },
      orderTimeline: { create: timelineCreate },
      orderStatusAudit: { create: jest.fn().mockResolvedValue({}) },
      $executeRaw: executeRaw,
      executeRaw,
      orderUpdate,
      timelineCreate,
    };
  }

  it('returns existing order without writes when status unchanged', async () => {
    const existingOrder = {
      id: 'order-1',
      orderNumber: 'ORD-2026-000001',
      status: 'pending',
      butcher: { id: 'b1', userId: 'butcher-1' },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          ...transitionTx(),
          butcherOrder: {
            findUnique: jest.fn().mockResolvedValue(existingOrder),
            update: jest.fn(),
          },
        }),
    );

    const result = await service.transitionOrder({
      orderId: 'order-1',
      actorId: 'butcher-1',
      nextStatus: 'pending',
    });

    expect(result).toEqual(existingOrder);
    expect(notifications.notifyUsers).not.toHaveBeenCalled();
    expect(sockets.emitToUser).not.toHaveBeenCalled();
  });

  it('rejects confirm when order is unpaid', async () => {
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          $queryRaw: jest.fn().mockResolvedValue([
            { ...lockedRow, paymentStatus: 'unpaid' },
          ]),
          butcherOrderItem: { findMany: jest.fn() },
          butcherOrder: { findUnique: jest.fn(), update: jest.fn() },
          orderTimeline: { create: jest.fn() },
          orderStatusAudit: { create: jest.fn() },
          $executeRaw: jest.fn(),
        }),
    );

    await expect(
      service.transitionOrder({
        orderId: 'order-1',
        actorId: 'butcher-1',
        nextStatus: 'confirmed',
      }),
    ).rejects.toMatchObject({ error: 'payment_required', status: 402 });
  });

  it('creates timeline, audit, and notifies on valid transition', async () => {
    const tx = transitionTx({ nextStatus: 'confirmed' });
    tx.orderUpdate.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-2026-000001',
      status: 'confirmed',
      butcher: { id: 'b1', userId: 'butcher-1' },
    });
    tx.timelineCreate.mockResolvedValue({
      status: 'confirmed',
      note: null,
      createdAt: new Date('2026-07-07T10:00:00Z'),
    });

    prisma.$transaction.mockImplementation(
      async (fn: (txArg: unknown) => Promise<unknown>) => fn(tx),
    );

    const result = await service.transitionOrder({
      orderId: 'order-1',
      actorId: 'butcher-1',
      nextStatus: 'confirmed',
    });

    expect(result.status).toBe('confirmed');
    expect(tx.timelineCreate).toHaveBeenCalled();
    expect(notifications.notifyUsers).toHaveBeenCalled();
  });

  it('rejects invalid transitions inside the transaction', async () => {
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn(transitionTx()),
    );

    await expect(
      service.transitionOrder({
        orderId: 'order-1',
        actorId: 'butcher-1',
        nextStatus: 'delivered',
      }),
    ).rejects.toBeInstanceOf(ApiException);
  });

  it('stores cancellation reason and releases inventory for legacy header row', async () => {
    const tx = transitionTx();

    prisma.$transaction.mockImplementation(
      async (fn: (txArg: unknown) => Promise<unknown>) => fn(tx),
    );

    await service.transitionOrder({
      orderId: 'order-1',
      actorId: 'butcher-1',
      nextStatus: 'cancelled',
      cancellationReason: 'المنتج غير متوفر',
    });

    expect(tx.executeRaw).toHaveBeenCalled();
    expect(tx.timelineCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          note: 'المنتج غير متوفر',
          status: 'cancelled',
        }),
      }),
    );
  });

  it('releases inventory for each order item on cancel', async () => {
    const tx = transitionTx({
      inventoryItems: [
        { productId: 'p1', reservedQuantity: 2 },
        { productId: 'p2', reservedQuantity: 1.5 },
      ],
    });

    prisma.$transaction.mockImplementation(
      async (fn: (txArg: unknown) => Promise<unknown>) => fn(tx),
    );

    await service.transitionOrder({
      orderId: 'order-1',
      actorId: 'butcher-1',
      nextStatus: 'cancelled',
    });

    expect(tx.executeRaw).toHaveBeenCalledTimes(2);
  });

  it('creates order with nested items in one transaction', async () => {
    const orderCreate = jest.fn().mockResolvedValue({
      id: 'order-new',
      orderNumber: 'ORD-2026-000001',
      status: 'pending',
      customerId: 'c1',
      butcher: { id: 'b1', userId: 'butcher-1', nameAr: 'ملحمة' },
      items: [{ productId: 'p1' }],
    });

    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          $executeRaw: jest.fn().mockResolvedValue(1),
          orderNumberSequence: {
            upsert: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({ lastNumber: 1 }),
          },
          butcherOrder: { create: orderCreate },
          orderTimeline: { create: jest.fn().mockResolvedValue({}) },
        }),
    );

    await service.createOrder({
      butcherId: 'b1',
      customerId: 'c1',
      deliveryType: 'pickup',
      currency: 'SAR',
      totalPrice: 150,
      items: [
        {
          productId: 'p1',
          cutType: 'whole',
          weightKg: 2,
          linePrice: 100,
          reservedQuantity: 2,
        },
        {
          productId: 'p2',
          cutType: 'sliced',
          weightKg: 1,
          linePrice: 50,
          reservedQuantity: 1,
        },
      ],
    });

    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: 'p1',
          totalPrice: 150,
          items: {
            create: expect.arrayContaining([
              expect.objectContaining({ productId: 'p1', linePrice: 100 }),
              expect.objectContaining({ productId: 'p2', linePrice: 50 }),
            ]),
          },
        }),
      }),
    );
  });
});
