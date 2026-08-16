import {
  resolveSaudiMainCities,
  SAUDI_MAIN_CITIES,
  SAUDI_REGIONS,
} from '../constants/saudiRegions';

describe('saudiRegions main cities', () => {
  it('resolves the featured city chips used by the region sheet', () => {
    const cities = resolveSaudiMainCities();
    expect(cities.length).toBe(SAUDI_MAIN_CITIES.length);
    expect(cities.map((c) => c.city.nameAr)).toEqual([
      'الدمام',
      'الرياض',
      'جدة',
      'المدينة المنورة',
      'مكة المكرمة',
    ]);
    expect(SAUDI_REGIONS.length).toBe(13);
  });
});
