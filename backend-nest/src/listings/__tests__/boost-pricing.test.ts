import {
  lookupPromotePrice,
  listPromoteCatalogOptions,
  PROMOTE_CATALOG,
} from '../promote-catalog';
import { BOOST_PLANS } from '../boost/boost-plans.config';
import { PROMOTION_PLANS } from '../promotion/promotion-tiers.config';
import {
  boostPriceForHours,
  promotionPriceForHours,
} from '../boost/boost-pricing.util';

describe('official promote catalog', () => {
  it('exposes the agreed Sarh prices', () => {
    expect(lookupPromotePrice('featured', { durationDays: 1 })?.amount).toBe(9);
    expect(lookupPromotePrice('featured', { durationDays: 3 })?.amount).toBe(
      25,
    );
    expect(lookupPromotePrice('pinned', { durationHours: 24 })?.amount).toBe(
      12,
    );
    expect(lookupPromotePrice('pinned', { durationHours: 72 })?.amount).toBe(
      29,
    );
    expect(lookupPromotePrice('visibility', { durationDays: 1 })?.amount).toBe(
      19,
    );
    expect(lookupPromotePrice('visibility', { durationDays: 2 })?.amount).toBe(
      35,
    );
  });

  it('rejects durations that are not in the catalog', () => {
    expect(lookupPromotePrice('featured', { durationHours: 12 })).toBeNull();
    expect(lookupPromotePrice('visibility', { durationDays: 3 })).toBeNull();
    expect(lookupPromotePrice('pinned', { durationDays: 7 })).toBeNull();
  });

  it('derives both as featured + pinned', () => {
    expect(lookupPromotePrice('both', { durationDays: 1 })?.amount).toBe(21);
    expect(lookupPromotePrice('both', { durationDays: 3 })?.amount).toBe(54);
  });

  it('ignores client-looking extra hours that are not listed', () => {
    expect(boostPriceForHours('featured', 24)).toBe(9);
    expect(boostPriceForHours('featured', 25)).toBe(0);
    expect(promotionPriceForHours(24)).toBe(19);
    expect(promotionPriceForHours(48)).toBe(35);
    expect(promotionPriceForHours(72)).toBe(0);
  });

  it('keeps plan APIs on the same catalog', () => {
    expect(BOOST_PLANS.featured.map((row) => row.amount)).toEqual([9, 25]);
    expect(BOOST_PLANS.pinned.map((row) => row.amount)).toEqual([12, 29]);
    expect(PROMOTION_PLANS.map((row) => row.amount)).toEqual([19, 35]);
    expect(listPromoteCatalogOptions('visibility')).toHaveLength(2);
    expect(PROMOTE_CATALOG).toHaveLength(6);
  });
});
