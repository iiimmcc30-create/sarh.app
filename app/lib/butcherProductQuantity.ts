import type { ButcherProduct } from '@/services/butcherData';

const KG_UNIT_ALIASES = new Set([
  'kg',
  'kilogram',
  'kilograms',
  'كجم',
  'كيلو',
  'كيلوغرام',
  'كيلوجرام',
  'كغ',
]);

export type ProductQuantityMode =
  | 'sarh_weight'
  | 'daftra_weight'
  | 'daftra_quantity'
  | 'none';

export function isKgSaleUnit(unit: string | null | undefined): boolean {
  if (!unit) return false;
  const normalized = unit.trim().toLowerCase().replace(/\s+/g, '');
  if (!normalized) return false;
  if (KG_UNIT_ALIASES.has(normalized)) return true;
  return normalized === 'kg' || normalized.endsWith('kg');
}

export function getProductQuantityMode(
  product: Pick<ButcherProduct, 'pricePerKg' | 'priceFixed' | 'saleUnit'>,
): ProductQuantityMode {
  if (product.pricePerKg != null) return 'sarh_weight';
  if (product.priceFixed != null && product.saleUnit) {
    return isKgSaleUnit(product.saleUnit) ? 'daftra_weight' : 'daftra_quantity';
  }
  return 'none';
}

export function showsProductStepper(mode: ProductQuantityMode): boolean {
  return mode !== 'none';
}

export function resolveLineQuantity(raw: string, fallback = 1): number {
  const n = parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, 999);
}
