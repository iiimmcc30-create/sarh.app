import { throwApi } from '../../common/exceptions/api.exception';

export type ProductForOrderLine = {
  id: string;
  butcherId: string;
  inStock: boolean;
  weightMin: number | null;
  weightMax: number | null;
  priceFixed: number | null;
  pricePerKg: number | null;
};

export type ValidatedOrderLine = {
  productId: string;
  cutType: string;
  weightKg: number;
  linePrice: number;
  reservedQuantity: number;
};

/** Same pricing rules as ButchersService.createOrder (backend source of truth). */
export function computeOrderLinePrice(
  product: Pick<ProductForOrderLine, 'priceFixed' | 'pricePerKg'>,
  weightKg: number,
): number {
  let totalPrice: number;
  if (product.priceFixed != null) {
    totalPrice = product.priceFixed;
  } else if (product.pricePerKg != null) {
    totalPrice = product.pricePerKg * weightKg;
  } else {
    throwApi(400, 'validation_error', 'المنتج لا يحتوي على سعر');
  }
  return Math.round(totalPrice * 100) / 100;
}

export function validateAndPriceOrderLine(
  product: ProductForOrderLine | null,
  butcherId: string,
  line: { productId: string; cutType: string; weightKg: number },
): ValidatedOrderLine {
  if (!product || product.butcherId !== butcherId) {
    throwApi(404, 'not_found', 'المنتج غير موجود');
  }

  if (!product.inStock) {
    throwApi(400, 'validation_error', 'المنتج غير متوفر حالياً');
  }

  if (product.weightMin != null && line.weightKg < product.weightMin) {
    throwApi(
      400,
      'validation_error',
      `الوزن يجب أن يكون ${product.weightMin} كجم على الأقل`,
    );
  }

  if (product.weightMax != null && line.weightKg > product.weightMax) {
    throwApi(
      400,
      'validation_error',
      `الوزن يجب ألا يتجاوز ${product.weightMax} كجم`,
    );
  }

  const linePrice = computeOrderLinePrice(product, line.weightKg);
  const reservedQuantity = Math.max(line.weightKg, 0);

  return {
    productId: line.productId,
    cutType: line.cutType,
    weightKg: line.weightKg,
    linePrice,
    reservedQuantity,
  };
}

export function sumOrderLinePrices(lines: ValidatedOrderLine[]): number {
  const sum = lines.reduce((acc, line) => acc + line.linePrice, 0);
  return Math.round(sum * 100) / 100;
}
