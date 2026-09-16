import {
  createCheckoutWithReservations,
  fulfillPaidCheckout,
  releaseCheckoutReservations,
  reserveProductQuantity,
} from './butcher-checkout.lifecycle';
import type { ValidatedOrderLine } from './order-line.util';

type ProductRow = {
  id: string;
  inStock: boolean;
  availableQuantity: number;
  reservedQuantity: number;
};

type CheckoutRow = {
  id: string;
  userId: string;
  butcherId: string;
  paymentId: string | null;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';
  expiresAt: Date;
  deliveryType: string;
  deliveryAddress: string | null;
  notes: string | null;
  currency: string;
  totalPrice: number;
  itemsSnapshot: unknown;
};

type ReservationRow = {
  id: string;
  checkoutId: string;
  userId: string;
  productId: string;
  quantity: number;
  status: 'held' | 'converted' | 'released';
  releasedAt: Date | null;
};

type OrderRow = {
  id: string;
  orderNumber: string;
  butcherId: string;
  customerId: string;
  paymentId: string | null;
  checkoutId: string | null;
  paymentStatus: string;
  status: string;
  reservedQuantity: number;
};

function line(overrides: Partial<ValidatedOrderLine> = {}): ValidatedOrderLine {
  return {
    productId: 'prod-1',
    cutType: 'whole',
    weightKg: 2,
    linePrice: 80,
    reservedQuantity: 2,
    ...overrides,
  };
}

function createStore() {
  const products = new Map<string, ProductRow>([
    [
      'prod-1',
      {
        id: 'prod-1',
        inStock: true,
        availableQuantity: 10,
        reservedQuantity: 0,
      },
    ],
    [
      'prod-2',
      {
        id: 'prod-2',
        inStock: true,
        availableQuantity: 3,
        reservedQuantity: 0,
      },
    ],
  ]);
  const checkouts = new Map<string, CheckoutRow>();
  const reservations: ReservationRow[] = [];
  const orders = new Map<string, OrderRow>();
  const timelines: Array<{ orderId: string; note: string }> = [];
  let seq = 0;
  let checkoutSeq = 0;
  let reservationSeq = 0;
  let mutex: Promise<void> = Promise.resolve();

  function withLock<T>(fn: () => Promise<T>): Promise<T> {
    const run = mutex.then(fn, fn);
    mutex = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  function tx() {
    return {
      $executeRaw: async (
        strings: TemplateStringsArray,
        ...values: unknown[]
      ) => {
        const sql = strings.join(' ');
        if (sql.includes('"reservedQuantity" = "reservedQuantity" +')) {
          const quantity = Number(values[0]);
          const productId = String(values[1]);
          const product = products.get(productId);
          if (
            !product ||
            !product.inStock ||
            product.availableQuantity - product.reservedQuantity < quantity
          ) {
            return 0;
          }
          product.reservedQuantity += quantity;
          return 1;
        }
        if (sql.includes('GREATEST("reservedQuantity" -')) {
          const quantity = Number(values[0]);
          const productId = String(values[1]);
          const product = products.get(productId);
          if (product) {
            product.reservedQuantity = Math.max(
              product.reservedQuantity - quantity,
              0,
            );
          }
          return 1;
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      },
      $queryRaw: async (
        _strings: TemplateStringsArray,
        ...values: unknown[]
      ) => {
        const checkoutId = String(values[0]);
        const checkout = checkouts.get(checkoutId);
        return checkout ? [checkout] : [];
      },
      butcherCheckout: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          const id = `chk-${++checkoutSeq}`;
          const reservationCreates = (
            data.reservations as { create: Array<Record<string, unknown>> }
          ).create;
          const row: CheckoutRow = {
            id,
            userId: String(data.userId),
            butcherId: String(data.butcherId),
            paymentId: null,
            status: 'pending',
            expiresAt: data.expiresAt as Date,
            deliveryType: String(data.deliveryType),
            deliveryAddress: (data.deliveryAddress as string | null) ?? null,
            notes: (data.notes as string | null) ?? null,
            currency: String(data.currency),
            totalPrice: Number(data.totalPrice),
            itemsSnapshot: data.itemsSnapshot,
          };
          checkouts.set(id, row);
          for (const item of reservationCreates) {
            reservations.push({
              id: `res-${++reservationSeq}`,
              checkoutId: id,
              userId: String(item.userId),
              productId: String(item.productId),
              quantity: Number(item.quantity),
              status: 'held',
              releasedAt: null,
            });
          }
          return row;
        },
        findUnique: async ({
          where,
          select,
        }: {
          where: { id?: string; paymentId?: string };
          select?: Record<string, boolean>;
        }) => {
          const row = where.id
            ? checkouts.get(where.id)
            : [...checkouts.values()].find((c) => c.paymentId === where.paymentId);
          if (!row) return null;
          if (select?.itemsSnapshot) return { itemsSnapshot: row.itemsSnapshot };
          return row;
        },
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<CheckoutRow>;
        }) => {
          const row = checkouts.get(where.id);
          if (!row) throw new Error('missing checkout');
          Object.assign(row, data);
          return row;
        },
      },
      butcherCheckoutReservation: {
        findMany: async ({
          where,
        }: {
          where: { checkoutId: string; status?: string; userId?: string };
        }) =>
          reservations.filter(
            (row) =>
              row.checkoutId === where.checkoutId &&
              (!where.status || row.status === where.status) &&
              (!where.userId || row.userId === where.userId),
          ),
        updateMany: async ({
          where,
          data,
        }: {
          where: { checkoutId: string; status?: string; userId?: string };
          data: Partial<ReservationRow>;
        }) => {
          let count = 0;
          for (const row of reservations) {
            if (row.checkoutId !== where.checkoutId) continue;
            if (where.status && row.status !== where.status) continue;
            if (where.userId && row.userId !== where.userId) continue;
            Object.assign(row, data);
            count += 1;
          }
          return { count };
        },
      },
      butcherOrder: {
        findUnique: async ({
          where,
        }: {
          where: { paymentId?: string; checkoutId?: string; id?: string };
        }) => {
          const row = [...orders.values()].find((order) => {
            if (where.id) return order.id === where.id;
            if (where.paymentId) return order.paymentId === where.paymentId;
            if (where.checkoutId) return order.checkoutId === where.checkoutId;
            return false;
          });
          if (!row) return null;
          return {
            ...row,
            butcher: { userId: 'butcher-user', nameAr: 'ملحمة' },
          };
        },
        create: async ({
          data,
        }: {
          data: Record<string, unknown> & { items?: { create: unknown[] } };
        }) => {
          if (
            [...orders.values()].some(
              (order) =>
                (data.paymentId && order.paymentId === data.paymentId) ||
                (data.checkoutId && order.checkoutId === data.checkoutId),
            )
          ) {
            const err = new Error('Unique constraint') as Error & {
              code?: string;
            };
            err.code = 'P2002';
            throw err;
          }
          const id = `ord-${++seq}`;
          const row: OrderRow = {
            id,
            orderNumber: String(data.orderNumber),
            butcherId: String(data.butcherId),
            customerId: String(data.customerId),
            paymentId: (data.paymentId as string | null) ?? null,
            checkoutId: (data.checkoutId as string | null) ?? null,
            paymentStatus: String(data.paymentStatus),
            status: String(data.status),
            reservedQuantity: Number(data.reservedQuantity ?? 0),
          };
          orders.set(id, row);
          return {
            ...row,
            butcher: { userId: 'butcher-user', nameAr: 'ملحمة' },
          };
        },
      },
      orderTimeline: {
        create: async ({ data }: { data: { orderId: string; note: string } }) => {
          timelines.push(data);
          return data;
        },
      },
      orderNumberSequence: {
        upsert: async () => ({ year: 2026, lastNumber: seq }),
        update: async () => ({ lastNumber: seq + 1 }),
      },
    };
  }

  return {
    products,
    checkouts,
    reservations,
    orders,
    timelines,
    withLock,
    tx: () => tx() as never,
  };
}

describe('butcher checkout payment-first lifecycle', () => {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  const input = {
    userId: 'user-1',
    butcherId: 'butcher-1',
    deliveryType: 'pickup',
    currency: 'SAR',
    totalPrice: 80,
    items: [line()],
    expiresAt,
  };

  it('failed payment → 0 Final Orders and reservation released', async () => {
    const store = createStore();
    const checkout = await createCheckoutWithReservations(store.tx(), input);
    expect(store.products.get('prod-1')?.reservedQuantity).toBe(2);
    expect(store.orders.size).toBe(0);

    await releaseCheckoutReservations(store.tx(), checkout.id, 'failed');
    expect(store.orders.size).toBe(0);
    expect(store.products.get('prod-1')?.reservedQuantity).toBe(0);
    expect(store.checkouts.get(checkout.id)?.status).toBe('failed');
    expect(
      store.reservations.every((row) => row.status === 'released'),
    ).toBe(true);
  });

  it('cancelled payment → 0 Final Orders and reservation released', async () => {
    const store = createStore();
    const checkout = await createCheckoutWithReservations(store.tx(), input);
    await releaseCheckoutReservations(store.tx(), checkout.id, 'cancelled');
    expect(store.orders.size).toBe(0);
    expect(store.products.get('prod-1')?.reservedQuantity).toBe(0);
    expect(store.checkouts.get(checkout.id)?.status).toBe('cancelled');
  });

  it('pending payment → 0 Final Orders and reservation stays held', async () => {
    const store = createStore();
    await createCheckoutWithReservations(store.tx(), input);
    expect(store.orders.size).toBe(0);
    expect(store.products.get('prod-1')?.reservedQuantity).toBe(2);
    expect(store.reservations[0]?.status).toBe('held');
  });

  it('confirmed payment → 1 Final Order paid/pending with order number', async () => {
    const store = createStore();
    const checkout = await createCheckoutWithReservations(store.tx(), input);
    const result = await fulfillPaidCheckout(store.tx(), {
      checkoutId: checkout.id,
      paymentId: 'pay-1',
      userId: 'user-1',
    });
    expect(result.created).toBe(true);
    expect(store.orders.size).toBe(1);
    const order = [...store.orders.values()][0];
    expect(order.paymentStatus).toBe('paid');
    expect(order.status).toBe('pending');
    expect(order.orderNumber).toMatch(/^ORD-\d{4}-\d{6}$/);
    expect(order.paymentId).toBe('pay-1');
    expect(store.reservations[0]?.status).toBe('converted');
    expect(store.products.get('prod-1')?.reservedQuantity).toBe(2);
    expect(store.timelines[0]?.note).toContain('payment confirmed');
  });

  it('duplicate webhook/sync/fulfill → still 1 Final Order', async () => {
    const store = createStore();
    const checkout = await createCheckoutWithReservations(store.tx(), input);
    const params = {
      checkoutId: checkout.id,
      paymentId: 'pay-1',
      userId: 'user-1',
    };
    await fulfillPaidCheckout(store.tx(), params);
    const second = await fulfillPaidCheckout(store.tx(), params);
    const third = await fulfillPaidCheckout(store.tx(), params);
    expect(store.orders.size).toBe(1);
    expect(second.created).toBe(false);
    expect(third.created).toBe(false);
    expect(second.butcherOrder?.id).toBe([...store.orders.values()][0].id);
  });

  it('concurrent webhook + sync create exactly one Final Order', async () => {
    const store = createStore();
    const checkout = await createCheckoutWithReservations(store.tx(), input);
    const params = {
      checkoutId: checkout.id,
      paymentId: 'pay-race',
      userId: 'user-1',
    };
    const [a, b] = await Promise.all([
      store.withLock(() => fulfillPaidCheckout(store.tx(), params)),
      store.withLock(() => fulfillPaidCheckout(store.tx(), params)),
    ]);
    expect(store.orders.size).toBe(1);
    const createdCount = [a, b].filter((result) => result.created).length;
    expect(createdCount).toBe(1);
  });

  it('does not use another user reservation', async () => {
    const store = createStore();
    const checkout = await createCheckoutWithReservations(store.tx(), input);
    await expect(
      fulfillPaidCheckout(store.tx(), {
        checkoutId: checkout.id,
        paymentId: 'pay-x',
        userId: 'stranger',
      }),
    ).rejects.toThrow('does not belong');
    expect(store.orders.size).toBe(0);
  });

  it('expired checkout → reservation released and later confirm does not create an order', async () => {
    const store = createStore();
    const checkout = await createCheckoutWithReservations(store.tx(), input);
    await releaseCheckoutReservations(store.tx(), checkout.id, 'expired');
    expect(store.products.get('prod-1')?.reservedQuantity).toBe(0);
    const result = await fulfillPaidCheckout(store.tx(), {
      checkoutId: checkout.id,
      paymentId: 'pay-late',
      userId: 'user-1',
    });
    expect(result.capturedAfterCancel).toBe(true);
    expect(store.orders.size).toBe(0);
  });

  it('concurrent checkouts cannot reserve more than available stock', async () => {
    const store = createStore();
    const results = await Promise.allSettled([
      store.withLock(() =>
        createCheckoutWithReservations(store.tx(), {
          ...input,
          items: [line({ productId: 'prod-2', reservedQuantity: 2 })],
          totalPrice: 40,
        }),
      ),
      store.withLock(() =>
        createCheckoutWithReservations(store.tx(), {
          ...input,
          items: [line({ productId: 'prod-2', reservedQuantity: 2 })],
          totalPrice: 40,
        }),
      ),
    ]);
    const reserved = store.products.get('prod-2')?.reservedQuantity ?? 0;
    expect(reserved).toBeLessThanOrEqual(3);
    expect(store.checkouts.size).toBe(1);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  });

  it('unpaid checkout attempts are not Final Orders for customer or butcher', async () => {
    const store = createStore();
    await createCheckoutWithReservations(store.tx(), input);
    expect(store.orders.size).toBe(0);
    expect([...store.orders.values()].filter((o) => o.customerId === 'user-1')).toHaveLength(0);
    expect([...store.orders.values()].filter((o) => o.butcherId === 'butcher-1')).toHaveLength(0);
  });

  it('order number is generated only for the Final Order', async () => {
    const store = createStore();
    const checkout = await createCheckoutWithReservations(store.tx(), input);
    expect(checkout).not.toHaveProperty('orderNumber');
    const paid = await fulfillPaidCheckout(store.tx(), {
      checkoutId: checkout.id,
      paymentId: 'pay-num',
      userId: 'user-1',
    });
    expect(paid.butcherOrder?.orderNumber).toMatch(/^ORD-/);
  });
});

describe('reserveProductQuantity concurrency', () => {
  it('refuses a second hold that would exceed sellable quantity', async () => {
    const store = createStore();
    const ok = await reserveProductQuantity(store.tx(), 'prod-2', 3);
    const blocked = await reserveProductQuantity(store.tx(), 'prod-2', 1);
    expect(ok).toBe(true);
    expect(blocked).toBe(false);
    expect(store.products.get('prod-2')?.reservedQuantity).toBe(3);
  });
});
