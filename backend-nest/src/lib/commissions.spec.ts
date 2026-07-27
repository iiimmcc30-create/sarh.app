import {
  calculateCommission,
  isStoreExemptFromPermissions,
  shouldCreateFee,
} from './commissions';

describe('commissions', () => {
  it('does not charge USER livestock listings', () => {
    const r = calculateCommission('sheep', 1000, 2, {}, 'USER');
    expect(r.commission).toBe(0);
    expect(r.isExempt).toBe(true);
  });

  it('does not charge butcher non-store categories', () => {
    const r = calculateCommission('camels', 5000, 1, {}, 'BUTCHER');
    expect(r.commission).toBe(0);
  });

  it('applies store commission for butcher without exemption', () => {
    const r = calculateCommission(
      'store',
      200,
      1,
      { storeCommission: 5 },
      'BUTCHER',
    );
    expect(r.isExempt).toBe(false);
    expect(r.commission).toBeGreaterThan(0);
  });

  it('zero commission when storeCommission permission is 0', () => {
    const r = calculateCommission(
      'store',
      200,
      1,
      { storeCommission: 0 },
      'BUTCHER',
    );
    expect(r.isExempt).toBe(true);
    expect(r.commission).toBe(0);
  });

  it('isStoreExemptFromPermissions', () => {
    expect(isStoreExemptFromPermissions({ storeCommission: 0 })).toBe(true);
    expect(isStoreExemptFromPermissions({ storeCommission: 5 })).toBe(false);
    expect(isStoreExemptFromPermissions(undefined)).toBe(false);
  });

  it('shouldCreateFee respects audience and category', () => {
    expect(shouldCreateFee('store', { storeCommission: 5 }, 'BUTCHER')).toBe(true);
    expect(shouldCreateFee('store', { storeCommission: 0 }, 'BUTCHER')).toBe(false);
    expect(shouldCreateFee('sheep', {}, 'USER')).toBe(false);
  });
});
