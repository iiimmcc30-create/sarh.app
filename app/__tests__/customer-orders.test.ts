import {
  CUSTOMER_FLOW_LABELS,
  CUSTOMER_ORDER_FLOW,
  flowReached,
  orderLineItems,
  orderMoneySummary,
  orderProductSummary,
  orderSpecsLine,
  timelineStamp,
} from '../lib/customerOrders';

describe('customerOrders', () => {
  it('keeps the five customer tracking steps in RTL visual order', () => {
    expect(CUSTOMER_ORDER_FLOW).toEqual([
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'delivered',
    ]);
    expect(CUSTOMER_FLOW_LABELS.pending).toBe('قيد الانتظار');
    expect(CUSTOMER_FLOW_LABELS.delivered).toBe('تم التسليم');
  });

  it('summarizes product and specs for the outer card', () => {
    const order = {
      id: '1',
      orderNumber: 'ORD-1',
      butcherId: 'b',
      customerId: 'c',
      productId: 'p',
      cutType: 'whole',
      weightKg: 1,
      deliveryType: 'delivery',
      status: 'delivered',
      paymentStatus: 'paid',
      totalPrice: 1,
      currency: 'SAR',
      createdAt: '2026-08-14T15:08:00.000Z',
      product: { id: 'p', nameAr: 'خروف كامل' },
      items: [{ id: 'i1', productId: 'p', cutType: 'whole', weightKg: 1, linePrice: 1, product: { id: 'p', nameAr: 'خروف كامل' } }],
    } as const;
    expect(orderProductSummary(order as any)).toBe('خروف كامل');
    expect(orderSpecsLine(order as any)).toBe('1 كغ • كامل • توصيل');
  });

  it('builds item cards and money rows for the inner card', () => {
    const order = {
      id: '1',
      totalPrice: 1020,
      currency: 'SAR',
      items: [
        {
          id: 'i1',
          cutType: 'whole',
          weightKg: 1.2,
          linePrice: 1020,
          product: { nameAr: 'لحم ضأن طازج' },
        },
      ],
    };
    const lines = orderLineItems(order);
    expect(lines[0].name).toBe('لحم ضأن طازج');
    expect(lines[0].unitPrice).toBeCloseTo(850);
    expect(orderMoneySummary(order)).toEqual({
      subtotal: 1020,
      deliveryFee: null,
      total: 1020,
    });
  });

  it('marks flow steps reached and reads timeline times', () => {
    const reached = flowReached({
      status: 'preparing',
      timeline: [{ status: 'pending' }, { status: 'confirmed' }],
    });
    expect(reached.has('pending')).toBe(true);
    expect(reached.has('confirmed')).toBe(true);
    expect(reached.has('preparing')).toBe(true);
    expect(reached.has('ready')).toBe(false);
    expect(
      timelineStamp(
        [{ status: 'pending', createdAt: '2026-05-16T07:30:00.000Z' }],
        'pending',
      ),
    ).not.toBe('');
  });
});
