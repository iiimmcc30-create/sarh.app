import { API_BASE } from "@/services/api";
import { authFetch } from "@/services/authFetch";
import type { NIPaymentMethod } from "@/services/network_international";

export type ListingFeePaymentInit = {
  paymentId?: string;
  checkoutUrl?: string;
  devMode?: boolean;
};

export async function initiateListingFeePayment(params: {
  listingId: string;
  amount: number;
  method: NIPaymentMethod;
  listingTitle?: string;
}): Promise<
  { ok: true; data: ListingFeePaymentInit } | { ok: false; message: string }
> {
  try {
    const res = await authFetch(`${API_BASE}/api/payments/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: params.amount,
        currency: "SAR",
        method: params.method,
        type: "commission",
        referenceId: params.listingId,
        description: `sarh listing commission ${params.listingId}`,
        descriptionAr: params.listingTitle
          ? `سداد عمولة سرح — ${params.listingTitle}`
          : `سداد عمولة سرح — إعلان ${params.listingId}`,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success || !json.data) {
      return {
        ok: false,
        message:
          json.messageAr ??
          json.message ??
          "تعذّر بدء عملية الدفع. حاول مرة أخرى.",
      };
    }
    return { ok: true, data: json.data as ListingFeePaymentInit };
  } catch {
    return { ok: false, message: "تعذّر الاتصال بالخادم" };
  }
}
