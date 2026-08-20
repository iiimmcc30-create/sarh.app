import {
  clampSearchQuery,
  normalizeArabicSearchText,
  tokenizeSearchQuery,
} from './arabic-search.util';

describe('normalizeArabicSearchText', () => {
  it('removes tashkeel and normalizes alef variants', () => {
    expect(normalizeArabicSearchText('إِبل')).toBe('ابل');
    expect(normalizeArabicSearchText('آخر')).toBe('اخر');
  });

  it('maps alef maqsura and ta marbuta for matching', () => {
    expect(normalizeArabicSearchText('ملحمة')).toBe('ملحمه');
    expect(normalizeArabicSearchText(' على ')).toBe('علي');
  });

  it('collapses whitespace', () => {
    expect(normalizeArabicSearchText('  غنم   حري  ')).toBe('غنم حري');
  });
});

describe('tokenizeSearchQuery', () => {
  it('splits multi-word queries', () => {
    expect(tokenizeSearchQuery('غنم حري')).toEqual(['غنم', 'حري']);
  });

  it('deduplicates tokens', () => {
    expect(tokenizeSearchQuery('غنم غنم')).toEqual(['غنم']);
  });
});

describe('clampSearchQuery', () => {
  it('trims and limits length', () => {
    expect(clampSearchQuery('  abc  ')).toBe('abc');
    expect(clampSearchQuery('x'.repeat(200)).length).toBe(120);
  });
});
