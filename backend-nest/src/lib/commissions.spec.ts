import {
  BUTCHER_LISTING_COMMISSION_PERCENT,
  BUTCHER_ORDER_COMMISSION_PERCENT,
  BUTCHER_STORE_COMMISSION_PERCENT,
  butcherOrderCommissionPaymentRef,
  calculateCommission,
  calculateOrderCommission,
  isStoreExemptFromPermissions,
  roundMoney,
  shouldCreateFee,
} from './commissions';

describe('commissions — listing vs order separation', () => {
  it('keeps listing rate at 1% and order rate at 10%', () => {
    expect(BUTCHER_LISTING_COMMISSION_PERCENT).toBe(1);
    expect(BUTCHER_STORE_COMMISSION_PERCENT).toBe(1);
    expect(BUTCHER_ORDER_COMMISSION_PERCENT).toBe(10);
  });

  it('charges no listing fee for livestock categories', () => {
    const r = calculateCommission('sheep', 1000, 2, {}, 'USER');
    expect(r.isExempt).toBe(true);
    expect(r.commission).toBe(0);
  });

  it('charges no store listing fee when audience is not BUTCHER', () => {
    const r = calculateCommission('store', 5000, 1, {}, 'USER');
    expect(r.isExempt).toBe(true);
    expect(r.commission).toBe(0);
  });

  it('listing value 100 → listing commission 1', () => {
    const r = calculateCommission(
      'store',
      100,
      1,
      { storeCommission: BUTCHER_LISTING_COMMISSION_PERCENT },
      'BUTCHER',
    );
    expect(r.isExempt).toBe(false);
    expect(r.commission).toBe(1);
    expect(r.ruleDescription).not.toMatch(/1\s*%/);
    expect(r.ruleDescription).not.toMatch(/10\s*%/);
  });

  it('uses platform listing 1% even when plan feature still stores legacy 5', () => {
    const r = calculateCommission(
      'store',
      1000,
      1,
      { storeCommission: 5 },
      'BUTCHER',
    );
    expect(r.isExempt).toBe(false);
    expect(r.commission).toBe(10); // ceil(1000 * 1 / 100)
  });

  it('zero listing commission when storeCommission permission is 0', () => {
    const r = calculateCommission(
      'store',
      1000,
      1,
      { storeCommission: 0 },
      'BUTCHER',
    );
    expect(r.isExempt).toBe(true);
    expect(r.commission).toBe(0);
  });

  it('order value 100 → order commission 10', () => {
    const r = calculateOrderCommission(100, { storeCommission: 1 });
    expect(r.isExempt).toBe(false);
    expect(r.commission).toBe(10);
    expect(r.ratePercent).toBe(10);
  });

  it('changing order rate constant does not affect listing calc', () => {
    expect(BUTCHER_ORDER_COMMISSION_PERCENT).toBe(10);
    const listing = calculateCommission(
      'store',
      100,
      1,
      { storeCommission: 1 },
      'BUTCHER',
    );
    expect(listing.commission).toBe(1);
  });

  it('non-completed order amounts are not charged by calculateOrderCommission alone — callers gate status', () => {
    // Pure calc always returns a number; lifecycle must only call on delivered.
    expect(
      calculateOrderCommission(100, { storeCommission: 1 }).commission,
    ).toBe(10);
  });

  it('subscription exemption zeros order commission', () => {
    const r = calculateOrderCommission(100, { storeCommission: 0 });
    expect(r.isExempt).toBe(true);
    expect(r.commission).toBe(0);
  });

  it('rounds order commission to 2 decimal places', () => {
    expect(roundMoney(9.999)).toBe(10);
    expect(
      calculateOrderCommission(99.99, { storeCommission: 1 }).commission,
    ).toBe(10);
  });

  it('exemption helpers respect subscription zero-rate', () => {
    expect(isStoreExemptFromPermissions({ storeCommission: 0 })).toBe(true);
    expect(isStoreExemptFromPermissions({ storeCommission: 1 })).toBe(false);
    expect(isStoreExemptFromPermissions({ storeCommission: 10 })).toBe(false);
  });

  it('shouldCreateFee only for non-exempt butcher store listings', () => {
    expect(shouldCreateFee('store', { storeCommission: 1 }, 'BUTCHER')).toBe(
      true,
    );
    expect(shouldCreateFee('store', { storeCommission: 0 }, 'BUTCHER')).toBe(
      false,
    );
    expect(shouldCreateFee('sheep', { storeCommission: 1 }, 'BUTCHER')).toBe(
      false,
    );
  });

  it('does not change non-store listing commission rules', () => {
    const sheep = calculateCommission('sheep', 1000, 3, {}, 'USER');
    expect(sheep.commission).toBe(0);
    const horses = calculateCommission('horses', 1000, 1, {}, 'USER');
    expect(horses.commission).toBe(0);
  });

  it('builds stable idempotent payment refs per order', () => {
    expect(butcherOrderCommissionPaymentRef('abc')).toBe('BOC-abc');
  });
});
