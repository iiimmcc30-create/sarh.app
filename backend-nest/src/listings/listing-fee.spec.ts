import {
  calculateListingFeeAmount,
  parsePositiveMoneyAmount,
} from './listing-fee';

describe('listing fee 1%', () => {
  it('100 → 1, 1000 → 10, 10000 → 100', () => {
    expect(calculateListingFeeAmount(100)).toBe(1);
    expect(calculateListingFeeAmount(1000)).toBe(10);
    expect(calculateListingFeeAmount(10000)).toBe(100);
  });

  it('rejects negative, zero, NaN, Infinity, and non-numeric strings', () => {
    expect(parsePositiveMoneyAmount(-1)).toBeNull();
    expect(parsePositiveMoneyAmount(0)).toBeNull();
    expect(parsePositiveMoneyAmount(Number.NaN)).toBeNull();
    expect(parsePositiveMoneyAmount(Number.POSITIVE_INFINITY)).toBeNull();
    expect(parsePositiveMoneyAmount('abc')).toBeNull();
    expect(parsePositiveMoneyAmount('10000')).toBe(10000);
  });
});
