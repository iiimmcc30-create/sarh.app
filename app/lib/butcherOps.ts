import type { DeliveryType, OrderStatus } from '@/services/butcherData';
import { CUT_LABELS, cutLabelAr, orderStatusLabel } from '@/services/butcherData';

export type OpsOrderFilter =
  | 'all'
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export type OpsManageTab = 'home' | 'orders' | 'products' | 'offers' | 'stories' | 'shop';

export const OPS_MANAGE_TABS: { id: OpsManageTab; label: string; icon: string }[] = [
  { id: 'home', label: 'التشغيل', icon: 'grid-outline' },
  { id: 'orders', label: 'الطلبات', icon: 'clipboard-outline' },
  { id: 'products', label: 'المنتجات', icon: 'cube-outline' },
  { id: 'offers', label: 'العروض', icon: 'pricetag-outline' },
  { id: 'stories', label: 'القصص', icon: 'camera-outline' },
  { id: 'shop', label: 'الملحمة', icon: 'storefront-outline' },
];

export const OPS_ORDER_FILTERS: { id: OpsOrderFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'pending', label: 'جديدة' },
  { id: 'preparing', label: 'قيد التجهيز' },
  { id: 'ready', label: 'جاهزة' },
  { id: 'delivering', label: 'قيد التوصيل' },
  { id: 'delivered', label: 'مكتملة' },
  { id: 'cancelled', label: 'ملغاة' },
];

export const OPS_STATUS_COLORS: Record<string, string> = {
  pending: '#D4A017',
  confirmed: '#20B66F',
  preparing: '#5B8FA8',
  ready: '#20B66F',
  delivered: '#20B66F',
  cancelled: '#E85D5D',
};

export function isDeliveryOrder(order: { deliveryType?: string }): boolean {
  return order.deliveryType === 'delivery';
}

/** Visual ops bucket — maps onto existing statuses only (no courier / delivering status). */
export function opsBucket(order: { status?: string; deliveryType?: string }): OpsOrderFilter {
  const status = order.status as OrderStatus | undefined;
  if (status === 'pending' || status === 'confirmed') return 'pending';
  if (status === 'preparing') return 'preparing';
  if (status === 'ready' && isDeliveryOrder(order)) return 'delivering';
  if (status === 'ready') return 'ready';
  if (status === 'delivered') return 'delivered';
  if (status === 'cancelled') return 'cancelled';
  return 'all';
}

export function matchesOpsFilter(
  order: { status?: string; deliveryType?: string },
  filter: OpsOrderFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'pending') return order.status === 'pending';
  if (filter === 'preparing') return order.status === 'confirmed' || order.status === 'preparing';
  if (filter === 'ready') return order.status === 'ready' && !isDeliveryOrder(order);
  if (filter === 'delivering') return order.status === 'ready' && isDeliveryOrder(order);
  if (filter === 'delivered') return order.status === 'delivered';
  if (filter === 'cancelled') return order.status === 'cancelled';
  return true;
}

export function opsStatusLabel(status?: string, deliveryType?: DeliveryType): string {
  if (status === 'pending') return 'جديدة';
  if (status === 'confirmed') return 'مقبولة';
  if (status === 'preparing') return 'قيد التجهيز';
  if (status === 'ready' && deliveryType === 'delivery') return 'قيد التوصيل';
  if (status === 'ready') return 'جاهزة';
  return orderStatusLabel((status as OrderStatus) ?? 'pending', deliveryType);
}

export function primaryAdvanceAction(order: {
  status?: string;
  deliveryType?: string;
  paymentStatus?: string;
  allowedNextStatuses?: string[];
}): { next: string; label: string } | null {
  const allowed = Array.isArray(order.allowedNextStatuses) ? order.allowedNextStatuses : [];
  const next = allowed.find((s) => s !== 'cancelled');
  if (!next) return null;
  if (next === 'confirmed' && order.paymentStatus !== 'paid') return null;
  const label =
    next === 'confirmed'
      ? 'قبول الطلب'
      : next === 'preparing'
        ? 'بدء التجهيز'
        : next === 'ready'
          ? 'تم التجهيز'
          : isDeliveryOrder(order)
            ? 'تم التسليم'
            : 'تم الاستلام';
  return { next, label };
}

export function orderShortId(order: { orderNumber?: string; id?: string }): string {
  if (order.orderNumber) return String(order.orderNumber);
  if (order.id) return `#${String(order.id).slice(0, 8).toUpperCase()}`;
  return 'طلب';
}

export function orderCustomerName(order: {
  customer?: { arabicName?: string; displayName?: string };
}): string {
  return order.customer?.arabicName || order.customer?.displayName || 'عميل سرح';
}

export function orderLineSummary(order: any): string {
  const items = Array.isArray(order.items) ? order.items : [];
  if (items.length > 0) {
    return items
      .map((item: any) => {
        const name = item.product?.nameAr || item.nameAr || 'منتج';
        const qty = item.weightKg ?? item.quantity;
        const cut = item.cutType ? cutLabelAr(item.cutType) : '';
        const qtyPart = qty != null ? `${qty} كغ` : '';
        return [name, cut, qtyPart].filter(Boolean).join(' · ');
      })
      .join('، ');
  }
  const name = order.product?.nameAr || 'منتج لحم';
  const cut = CUT_LABELS[order.cutType as keyof typeof CUT_LABELS]?.ar ?? order.cutType;
  const weight = order.weightKg != null ? `${order.weightKg} كغ` : '';
  return [name, cut, weight].filter(Boolean).join(' · ');
}

export function isSameLocalDay(iso?: string, now = new Date()): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function summarizeOrders(orders: any[]) {
  const today = new Date();
  const deliveredToday = orders.filter((o) => o.status === 'delivered' && isSameLocalDay(o.createdAt, today));
  const salesToday = deliveredToday.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
  const deliveryNow = orders.filter((o) => o.status === 'ready' && isDeliveryOrder(o)).length;
  return {
    newCount: orders.filter((o) => o.status === 'pending').length,
    needsAction: orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length,
    preparing: orders.filter((o) => o.status === 'confirmed' || o.status === 'preparing').length,
    readyPickup: orders.filter((o) => o.status === 'ready' && !isDeliveryOrder(o)).length,
    delivering: deliveryNow,
    completedToday: deliveredToday.length,
    salesToday,
    deliveryNow,
  };
}

export function groupOrdersByHour(orders: any[]): { key: string; label: string; count: number; orders: any[] }[] {
  const buckets = new Map<string, any[]>();
  for (const order of orders) {
    const d = new Date(order.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const hour = d.getHours();
    const key = `${hour}`;
    const list = buckets.get(key) ?? [];
    list.push(order);
    buckets.set(key, list);
  }
  return [...buckets.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([key, list]) => {
      const hour = Number(key);
      const next = (hour + 1) % 24;
      const fmt = (h: number) => {
        const period = h >= 12 ? 'م' : 'ص';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:00 ${period}`;
      };
      return {
        key,
        label: `${fmt(hour)} – ${fmt(next)}`,
        count: list.length,
        orders: list,
      };
    });
}

export type ProductStockKind = 'ok' | 'low' | 'out';

export function productStock(product: {
  inStock?: boolean;
  availableQuantity?: number | null;
}): { kind: ProductStockKind; label: string } {
  const qty = product.availableQuantity;
  if (product.inStock === false || (qty != null && Number(qty) <= 0)) {
    return { kind: 'out', label: 'غير متوفر' };
  }
  if (qty != null && Number(qty) <= 5) {
    return { kind: 'low', label: 'منخفض المخزون' };
  }
  return { kind: 'ok', label: 'متوفر' };
}

export function mapsUrlForAddress(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export const OPS_FLOW_PICKUP = [
  { id: 'pending', label: 'تم إنشاء الطلب' },
  { id: 'confirmed', label: 'تم قبول الطلب' },
  { id: 'preparing', label: 'جاري التجهيز' },
  { id: 'ready', label: 'جاهز' },
  { id: 'delivered', label: 'تم الاستلام' },
] as const;

export const OPS_FLOW_DELIVERY = [
  { id: 'pending', label: 'تم إنشاء الطلب' },
  { id: 'confirmed', label: 'تم قبول الطلب' },
  { id: 'preparing', label: 'جاري التجهيز' },
  { id: 'ready', label: 'جاهز' },
  { id: 'delivering', label: 'جاري التوصيل' },
  { id: 'delivered', label: 'تم التسليم' },
] as const;

export function flowStepDone(status: string, stepId: string, delivery: boolean): boolean {
  const rank: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    preparing: 2,
    ready: 3,
    delivering: 3,
    delivered: 5,
    cancelled: -1,
  };
  const current = rank[status] ?? 0;
  if (delivery && status === 'ready' && stepId === 'delivering') return false;
  if (delivery && status === 'ready' && stepId === 'ready') return true;
  if (delivery && status === 'delivered' && (stepId === 'ready' || stepId === 'delivering')) return true;
  const stepRank = rank[stepId] ?? 0;
  return current > stepRank || (current === stepRank && stepId !== 'delivering' && status === stepId);
}

export function flowStepActive(status: string, stepId: string, delivery: boolean): boolean {
  if (delivery && status === 'ready') return stepId === 'delivering';
  return status === stepId;
}

export function paymentMethodLabel(order: { paymentMethod?: string; paymentStatus?: string }): string {
  if (order.paymentMethod) return String(order.paymentMethod);
  return order.paymentStatus === 'paid' ? 'مدفوع' : 'غير مدفوع';
}
