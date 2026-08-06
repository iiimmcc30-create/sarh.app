import { API_BASE } from '@/services/api';
import type { DeliveryType, OrderPaymentStatus, OrderStatus } from '@/services/butcherData';

export type ButcherOrderRecord = {
  id: string;
  orderNumber: string;
  butcherId: string;
  customerId: string;
  productId: string;
  cutType: string;
  weightKg: number;
  reservedQuantity?: number;
  deliveryType: DeliveryType;
  deliveryAddress?: string | null;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  totalPrice: number;
  currency: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  butcher?: {
    id: string;
    nameAr?: string;
    logo?: string;
    cityAr?: string;
  };
  product?: {
    id: string;
    nameAr?: string;
    images?: string[];
    pricePerKg?: number;
    priceFixed?: number;
  };
  timeline?: Array<{ id: string; status: OrderStatus; note?: string; createdAt: string }>;
};

export async function fetchMyButcherOrders(
  accessToken: string,
): Promise<ButcherOrderRecord[]> {
  const res = await fetch(`${API_BASE}/api/butchers/orders`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.messageAr || json.message || 'تعذر تحميل الطلبات');
  }
  return Array.isArray(json.data) ? json.data : [];
}

export function isActiveOrder(order: ButcherOrderRecord): boolean {
  return order.status !== 'delivered' && order.status !== 'cancelled';
}

export function isInvoiceOrder(order: ButcherOrderRecord): boolean {
  return order.status === 'delivered' && order.paymentStatus === 'paid';
}

export function formatOrderDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatCurrency(amount: number, currency = 'SAR'): string {
  const symbol = currency === 'SAR' ? 'ر.س' : currency;
  return `${amount.toLocaleString('ar-SA')} ${symbol}`;
}
