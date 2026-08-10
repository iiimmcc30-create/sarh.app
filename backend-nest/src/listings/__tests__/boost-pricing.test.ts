import { boostPriceForHours, promotionPriceForHours, BOOST_RATE_PER_12H } from '../../listings/boost/boost-pricing.util';

describe('boost-pricing.util — slab formula', () => {
  describe('boostPriceForHours (PIN, rate=6)', () => {
    const cases: [number, number][] = [
      [1, 6],
      [12, 6],
      [13, 12],
      [24, 12],
      [25, 18],
      [36, 18],
      [37, 24],
      [48, 24],
      [49, 30],
      [60, 30],
      [61, 36],
      [72, 36],
      [73, 42],
      [84, 42],
      [85, 48],
      [96, 48],
    ];

    it.each(cases)('%i hours → %i SAR', (hours, expected) => {
      expect(boostPriceForHours('pinned', hours)).toBe(expected);
    });
  });

  describe('boostPriceForHours (FEATURE, rate=5)', () => {
    const cases: [number, number][] = [
      [1, 5],
      [12, 5],
      [13, 10],
      [24, 10],
      [25, 15],
      [36, 15],
      [37, 20],
      [48, 20],
      [49, 25],
      [60, 25],
      [61, 30],
      [72, 30],
      [73, 35],
      [84, 35],
    ];

    it.each(cases)('%i hours → %i SAR', (hours, expected) => {
      expect(boostPriceForHours('featured', hours)).toBe(expected);
    });
  });

  describe('boostPriceForHours (BOTH, rate=11)', () => {
    const cases: [number, number][] = [
      [1, 11],
      [12, 11],
      [13, 22],
      [24, 22],
      [25, 33],
      [36, 33],
    ];

    it.each(cases)('%i hours → %i SAR', (hours, expected) => {
      expect(boostPriceForHours('both', hours)).toBe(expected);
    });
  });

  describe('boostPriceForHours with custom rate override', () => {
    it('uses override rate instead of built-in', () => {
      expect(boostPriceForHours('pinned', 24, 8)).toBe(16); // ceil(24/12)*8 = 2*8 = 16
      expect(boostPriceForHours('featured', 24, 7)).toBe(14); // ceil(24/12)*7 = 2*7 = 14
    });
  });

  describe('promotionPriceForHours (base=10)', () => {
    const base = 10;
    const cases: [number, number][] = [
      [1, 10],
      [12, 10],
      [24, 10],
      [25, 20],
      [48, 20],
      [49, 30],
      [72, 30],
      [73, 40],
      [96, 40],
    ];

    it.each(cases)('%i hours → %i SAR (base=10)', (hours, expected) => {
      expect(promotionPriceForHours(hours, base)).toBe(expected);
    });
  });

  describe('promotionPriceForHours with custom base', () => {
    it('uses provided base rate', () => {
      expect(promotionPriceForHours(24, 15)).toBe(15);   // ceil(24/24)*15 = 15
      expect(promotionPriceForHours(25, 15)).toBe(30);   // ceil(25/24)*15 = 2*15 = 30
      expect(promotionPriceForHours(48, 15)).toBe(30);   // ceil(48/24)*15 = 2*15 = 30
    });
  });

  describe('BOOST_RATE_PER_12H constants', () => {
    it('pinned = 6', () => expect(BOOST_RATE_PER_12H.pinned).toBe(6));
    it('featured = 5', () => expect(BOOST_RATE_PER_12H.featured).toBe(5));
    it('both = 11', () => expect(BOOST_RATE_PER_12H.both).toBe(11));
  });
});
