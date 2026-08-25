import {
  BUTCHER_STORE_COMMISSION_PERCENT,
  calculateCommission,
  isStoreExemptFromPermissions,
  shouldCreateFee,
} from './commissions';

describe('commissions', () => {
  it('charges no listing fee for livestock categories', () => {
    const r = calculateCommission('sheep', 1000, 2, {}, 'USER');
    expect(r.isExempt).toBe(true);
    expect(r.commission).toBe(0);
  });

  it('charges no store fee when audience is not BUTCHER', () => {
    const r = calculateCommission('camels', 5000, 1, {}, 'BUTCHER');
    expect(r.isExempt).toBe(true);
    expect(r.commission).toBe(0);
  });

  it('applies 10% store commission for butcher without exemption', () => {
    const r = calculateCommission(
      'store',
      100,
      1,
      { storeCommission: BUTCHER_STORE_COMMISSION_PERCENT },
      'BUTCHER',
    );
    expect(r.isExempt).toBe(false);
    expect(r.commission).toBe(10);
    expect(r.ruleDescription).not.toMatch(/10\s*%/);
  });

  it('uses platform 10% even when plan feature still stores legacy 5', () => {
    const r = calculateCommission(
      'store',
      1000,
      1,
      { storeCommission: 5 },
      'BUTCHER',
    );
    expect(r.isExempt).toBe(false);
    expect(r.commission).toBe(100);
  });

  it('zero commission when storeCommission permission is 0', () => {
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

  it('exemption helpers respect subscription zero-rate', () => {
    expect(isStoreExemptFromPermissions({ storeCommission: 0 })).toBe(true);
    expect(isStoreExemptFromPermissions({ storeCommission: 5 })).toBe(false);
    expect(isStoreExemptFromPermissions({ storeCommission: 10 })).toBe(false);
  });

  it('shouldCreateFee only for non-exempt butcher store listings', () => {
    expect(shouldCreateFee('store', { storeCommission: 10 }, 'BUTCHER')).toBe(
      true,
    );
    expect(shouldCreateFee('store', { storeCommission: 0 }, 'BUTCHER')).toBe(
      false,
    );
    expect(shouldCreateFee('sheep', { storeCommission: 10 }, 'BUTCHER')).toBe(
      false,
    );
  });

  it('does not change non-store listing commission rules', () => {
    const sheep = calculateCommission('sheep', 1000, 3, {}, 'USER');
    expect(sheep.commission).toBe(0);
    const horses = calculateCommission('horses', 1000, 1, {}, 'USER');
    expect(horses.commission).toBe(0);
  });
});
