import {
  groupOrdersByHour,
  matchesOpsFilter,
  OPS_PRIMARY_TABS,
  primaryAdvanceAction,
  productStock,
  summarizeOrders,
} from '../lib/butcherOps';

describe('butcherOps', () => {
  it('exposes five primary manage tabs matching the ops reference', () => {
    expect(OPS_PRIMARY_TABS.map((t) => t.label)).toEqual([
      'التشغيل',
      'الطلبات',
      'المنتجات',
      'العروض',
      'القصص',
    ]);
  });
  it('summarizes operational buckets without a courier status', () => {
    const orders = [
      { status: 'pending', deliveryType: 'delivery', totalPrice: 10, createdAt: new Date().toISOString() },
      { status: 'confirmed', deliveryType: 'pickup', totalPrice: 20, createdAt: new Date().toISOString() },
      { status: 'preparing', deliveryType: 'delivery', totalPrice: 30, createdAt: new Date().toISOString() },
      { status: 'ready', deliveryType: 'delivery', totalPrice: 40, createdAt: new Date().toISOString() },
      { status: 'ready', deliveryType: 'pickup', totalPrice: 50, createdAt: new Date().toISOString() },
      { status: 'delivered', deliveryType: 'delivery', totalPrice: 90, createdAt: new Date().toISOString() },
    ];
    const s = summarizeOrders(orders);
    expect(s.newCount).toBe(1);
    expect(s.preparing).toBe(2);
    expect(s.delivering).toBe(1);
    expect(s.readyPickup).toBe(1);
    expect(s.completedToday).toBe(1);
    expect(s.salesToday).toBe(90);
  });

  it('maps primary actions onto existing statuses', () => {
    expect(primaryAdvanceAction({ status: 'pending', allowedNextStatuses: ['confirmed', 'cancelled'], paymentStatus: 'paid' })?.label).toBe('قبول الطلب');
    expect(primaryAdvanceAction({ status: 'confirmed', allowedNextStatuses: ['preparing', 'cancelled'] })?.label).toBe('بدء التجهيز');
    expect(primaryAdvanceAction({ status: 'preparing', allowedNextStatuses: ['ready'] })?.label).toBe('تم التجهيز');
    expect(primaryAdvanceAction({ status: 'ready', deliveryType: 'delivery', allowedNextStatuses: ['delivered'] })?.label).toBe('تم التسليم');
  });

  it('filters order tabs using existing statuses', () => {
    expect(matchesOpsFilter({ status: 'confirmed' }, 'preparing')).toBe(true);
    expect(matchesOpsFilter({ status: 'ready', deliveryType: 'delivery' }, 'delivering')).toBe(true);
    expect(matchesOpsFilter({ status: 'ready', deliveryType: 'pickup' }, 'ready')).toBe(true);
  });

  it('groups by hour and stock from current product fields', () => {
    const groups = groupOrdersByHour([
      { createdAt: '2026-08-14T17:10:00' },
      { createdAt: '2026-08-14T17:40:00' },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(2);
    expect(productStock({ inStock: true, availableQuantity: 2 }).kind).toBe('low');
    expect(productStock({ inStock: false }).kind).toBe('out');
  });
});
