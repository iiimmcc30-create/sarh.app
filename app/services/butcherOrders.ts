import { Alert } from 'react-native';
import { API_BASE } from '@/services/api';
import type { DeliveryType, OrderPaymentStatus, OrderStatus } from '@/services/butcherData';
import { isPayableButcherOrder } from '@/lib/customerOrders';
import { launchPaymentCheckout } from '@/services/payments';

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
  items?: Array<{
    id: string;
    productId: string;
    cutType: string;
    weightKg: number;
    linePrice: number;
    reservedQuantity?: number;
    product?: {
      id: string;
      nameAr?: string;
      images?: string[];
    };
  }>;
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

export async function completeButcherOrderPayment(params: {
  accessToken: string;
  order: Pick<
    ButcherOrderRecord,
    'id' | 'orderNumber' | 'totalPrice' | 'currency' | 'butcherId' | 'status' | 'paymentStatus'
  >;
}): Promise<'paid' | 'opened' | 'cancelled' | 'failed' | 'blocked'> {
  const { accessToken, order } = params;
  if (!isPayableButcherOrder(order)) {
    return 'blocked';
  }

  const amount = Number(order.totalPrice);
  if (!Number.isFinite(amount) || amount <= 0) {
    Alert.alert('خطأ', 'مبلغ الطلب غير صالح');
    return 'failed';
  }

  try {
    const payRes = await fetch(`${API_BASE}/api/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount,
        currency: order.currency || 'SAR',
        method: 'mada',
        type: 'butcher_order',
        referenceId: order.id,
        description: `Butcher order ${order.orderNumber}`,
        descriptionAr: `دفع طلب ملحمة رقم ${order.orderNumber}`,
      }),
    });
    const payJson = await payRes.json().catch(() => ({}));
    if (!payRes.ok || !payJson.success || !payJson.data) {
      Alert.alert(
        'لم يكتمل الدفع',
        payJson.messageAr || payJson.message || 'تعذّر بدء عملية الدفع. حاول مرة أخرى.',
      );
      return 'failed';
    }

    return launchPaymentCheckout({
      accessToken,
      paymentId: payJson.data.paymentId,
      checkoutUrl: payJson.data.checkoutUrl,
      devMode: payJson.data.devMode,
      context: 'butcher_order',
      returnParams: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        butcherId: order.butcherId,
      },
    });
  } catch {
    Alert.alert('خطأ', 'تعذر الاتصال بالخادم. يرجى التحقق من الشبكة.');
    return 'failed';
  }
}
