import type { ButcherProduct } from '@/services/butcherData';
import { parseOrderWeightKg } from '@/services/butcherData';

/** Same pricing rules as order.tsx / ButchersService.createOrder. */
export function computeProductLineTotal(
  product: ButcherProduct,
  weightKg: number,
): number {
  if (product.priceFixed != null) {
    return Math.round(product.priceFixed * 100) / 100;
  }
  if (product.pricePerKg != null) {
    return Math.round(product.pricePerKg * weightKg * 100) / 100;
  }
  return 0;
}

export function resolveLineWeightKg(
  rawWeight: string,
  product: ButcherProduct,
): number {
  return parseOrderWeightKg(rawWeight, product);
}

export function formatWeightLabel(product: ButcherProduct, weightKg: number): string {
  if (product.pricePerKg) {
    return `${weightKg} كغ`;
  }
  return '1';
}
