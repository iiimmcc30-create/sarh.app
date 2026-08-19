import { OrderStatus } from '@prisma/client';
import { ButchersService } from './butchers.service';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { ApiException } from '../common/exceptions/api.exception';
import type { JwtPayload } from '../common/types/jwt-payload.interface';

function jwt(userId: string, role: JwtPayload['role'] = 'BUTCHER'): JwtPayload {
  return { userId, username: userId, role };
}

describe('Butcher order isolation', () => {
  const repo = {
    findButcherIdByUser: jest.fn(),
    findOrdersForButcher: jest.fn(),
    findOrdersForCustomer: jest.fn(),
    findOrdersPage: jest.fn(),
    countOrders: jest.fn(),
    findOrderById: jest.fn(),
    findOrderWithButcher: jest.fn(),
    findOrderAudits: jest.fn(),
    findButcherForStats: jest.fn(),
    groupOrderStatusCounts: jest.fn(),
    sumSalesSince: jest.fn(),
    countOrdersSince: jest.fn(),
    findRecentOrdersForButcher: jest.fn(),
    findProductsInventory: jest.fn(),
    findProducts: jest.fn(),
    findProductWithButcher: jest.fn(),
    updateProduct: jest.fn(),
    softDeleteProduct: jest.fn(),
    createProduct: jest.fn(),
  };
  const redis = {
    cacheDel: jest.fn(),
    cacheGet: jest.fn(),
    cacheSet: jest.fn(),
  };
  const orderLifecycle = { transitionOrder: jest.fn(), createOrder: jest.fn() };
  const ranking = {};
  let service: ButchersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ButchersService(
      repo as never,
      redis as never,
      orderLifecycle as never,
      new OrderStateMachineService(),
      ranking as never,
    );
  });

  it('refuses butcher A reading butcher B order details', async () => {
    repo.findOrderById.mockResolvedValue({
      id: 'order-b',
      customerId: 'cust-b',
      butcher: { userId: 'user-b', id: 'butcher-b' },
      status: 'pending',
    });
    await expect(
      service.getOrderById('order-b', jwt('user-a')),
    ).rejects.toMatchObject({
      status: 403,
    } satisfies Partial<ApiException>);
    expect(repo.findOrderAudits).not.toHaveBeenCalled();
  });

  it('refuses butcher A updating butcher B order status', async () => {
    repo.findOrderWithButcher.mockResolvedValue({
      id: 'order-b',
      customerId: 'cust-b',
      butcher: { userId: 'user-b', id: 'butcher-b' },
      status: 'pending',
    });
    await expect(
      service.updateOrder('order-b', jwt('user-a'), { status: 'confirmed' }),
    ).rejects.toMatchObject({ status: 403 } satisfies Partial<ApiException>);
    expect(orderLifecycle.transitionOrder).not.toHaveBeenCalled();
  });

  it('ignores a forged butcherId query and lists only the JWT butcher orders', async () => {
    repo.findButcherIdByUser.mockResolvedValue({ id: 'butcher-a' });
    repo.findOrdersPage.mockResolvedValue([]);
    repo.countOrders.mockResolvedValue(0);

    await service.getOrders(jwt('user-a'), {
      page: '1',
      butcherId: 'butcher-b',
    });

    expect(repo.findOrdersPage).toHaveBeenCalledWith(
      expect.objectContaining({ butcherId: 'butcher-a' }),
      0,
      20,
      false,
    );
    expect(repo.findOrdersPage.mock.calls[0][0].butcherId).not.toBe(
      'butcher-b',
    );
  });

  it('rejects dashboard access when the user has no butcher profile', async () => {
    repo.findButcherForStats.mockResolvedValue(null);
    await expect(
      service.getDashboardSummary(jwt('user-plain', 'USER')),
    ).rejects.toMatchObject({
      status: 403,
    } satisfies Partial<ApiException>);
  });

  it('blocks an illegal status jump before lifecycle runs', async () => {
    repo.findOrderWithButcher.mockResolvedValue({
      id: 'order-a',
      customerId: 'cust-a',
      butcher: { userId: 'user-a', id: 'butcher-a' },
      status: 'pending',
    });
    orderLifecycle.transitionOrder.mockImplementation(
      async (params: { nextStatus: OrderStatus }) => {
        new OrderStateMachineService().assertTransition(
          'pending',
          params.nextStatus,
        );
        return { id: 'order-a', status: params.nextStatus };
      },
    );

    await expect(
      service.updateOrder('order-a', jwt('user-a'), { status: 'delivered' }),
    ).rejects.toMatchObject({ status: 409 } satisfies Partial<ApiException>);
  });

  it('treats a duplicate same-status request as a lifecycle no-op', async () => {
    repo.findOrderWithButcher.mockResolvedValue({
      id: 'order-a',
      customerId: 'cust-a',
      butcher: { userId: 'user-a', id: 'butcher-a' },
      status: 'preparing',
    });
    orderLifecycle.transitionOrder.mockResolvedValue({
      id: 'order-a',
      status: 'preparing',
    });

    const result = await service.updateOrder('order-a', jwt('user-a'), {
      status: 'preparing',
    });
    expect(result.status).toBe('preparing');
    expect(orderLifecycle.transitionOrder).toHaveBeenCalledTimes(1);
  });
});

describe('Butcher product isolation', () => {
  const repo = {
    findButcherIdByUser: jest.fn(),
    findProducts: jest.fn(),
    findProductWithButcher: jest.fn(),
    updateProduct: jest.fn(),
    softDeleteProduct: jest.fn(),
  };
  const redis = { cacheDel: jest.fn() };
  let service: ButchersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ButchersService(
      repo as never,
      redis as never,
      {} as never,
      new OrderStateMachineService(),
      {} as never,
    );
  });

  it('lists only products of the JWT butcher', async () => {
    repo.findButcherIdByUser.mockResolvedValue({ id: 'butcher-a' });
    repo.findProducts.mockResolvedValue([
      {
        id: 'p1',
        butcherId: 'butcher-a',
        inStock: true,
        availableQuantity: 12,
        reservedQuantity: 9,
        nameAr: 'لحم',
      },
    ]);
    const result = await service.getMyProducts(jwt('user-a'));
    expect(repo.findProducts).toHaveBeenCalledWith('butcher-a');
    expect(result[0].sellableQuantity).toBe(3);
    expect(result[0].stock).toBe('low');
  });

  it('refuses butcher A updating butcher B product', async () => {
    repo.findProductWithButcher.mockResolvedValue({
      id: 'p-b',
      butcher: { userId: 'user-b', id: 'butcher-b' },
    });
    await expect(
      service.updateProduct('p-b', jwt('user-a'), { inStock: false }),
    ).rejects.toMatchObject({ status: 403 } satisfies Partial<ApiException>);
    expect(repo.updateProduct).not.toHaveBeenCalled();
  });

  it('refuses butcher A deleting butcher B product', async () => {
    repo.findProductWithButcher.mockResolvedValue({
      id: 'p-b',
      butcher: { userId: 'user-b', id: 'butcher-b' },
    });
    await expect(
      service.deleteProduct('p-b', jwt('user-a')),
    ).rejects.toMatchObject({ status: 403 } satisfies Partial<ApiException>);
    expect(repo.softDeleteProduct).not.toHaveBeenCalled();
  });
});
