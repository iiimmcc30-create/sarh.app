import { mapDaftraProductPage, mapDaftraProductStock } from './daftra.mappers';

describe('daftra.mappers', () => {
  it('maps a paginated product list', () => {
    const page = mapDaftraProductPage({
      result: 'success',
      data: [
        {
          Product: {
            id: 9,
            name: 'لحم',
            product_code: 'SKU-1',
            unit_price: 40,
            stock_balance: 12,
            track_stock: 1,
          },
        },
      ],
      pagination: { page: 1, page_count: 3, total_results: 40 },
    });
    expect(page.items).toEqual([
      {
        id: 9,
        name: 'لحم',
        sku: 'SKU-1',
        price: 40,
        quantity: 12,
        trackStock: true,
        barcode: null,
      },
    ]);
    expect(page.pageCount).toBe(3);
  });

  it('maps empty product pages', () => {
    const page = mapDaftraProductPage({
      result: 'success',
      data: [],
      pagination: { page: 1, page_count: 1, total_results: 0 },
    });
    expect(page.items).toEqual([]);
    expect(page.totalResults).toBe(0);
  });

  it('prefers StockLevels for a single product when present', () => {
    const stock = mapDaftraProductStock({
      result: 'success',
      data: {
        Product: {
          id: 4,
          name: 'Item',
          product_code: 'A',
          stock_balance: 100,
          track_stock: 1,
        },
        StockLevels: [
          { store_id: 1, store_name: 'Main', quantity: 10 },
          { store_id: 2, store_name: 'Branch', quantity: 5 },
        ],
      },
    });
    expect(stock?.quantity).toBe(15);
    expect(stock?.source).toBe('stock_levels');
  });
});
