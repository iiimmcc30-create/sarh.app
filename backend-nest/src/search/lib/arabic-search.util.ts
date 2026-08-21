/** Arabic/Latin normalization for search matching only — never mutates stored values. */

const TASHKEEL_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const DIACRITICS_RE = /[\u0300-\u036f]/g;

const ARABIC_ALEF_VARIANTS: Record<string, string> = {
  '\u0623': '\u0627', // أ
  '\u0625': '\u0627', // إ
  '\u0622': '\u0627', // آ
  '\u0671': '\u0627', // ٱ
};

/** Normalize text for comparison (not for persistence). */
export function normalizeArabicSearchText(input: string): string {
  if (!input) return '';

  let text = input.normalize('NFKC');
  text = text.replace(TASHKEEL_RE, '').replace(DIACRITICS_RE, '');

  let out = '';
  for (const ch of text) {
    out += ARABIC_ALEF_VARIANTS[ch] ?? ch;
  }

  out = out
    .replace(/\u0649/g, '\u064A') // ى → ي
    .replace(/\u0629/g, '\u0647') // ة → ه (match-only)
    .replace(/\u0640/g, '') // tatweel
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('ar');

  return out;
}

/** Split query into meaningful tokens (min length enforced by caller). */
export function tokenizeSearchQuery(query: string): string[] {
  const normalized = normalizeArabicSearchText(query);
  if (!normalized) return [];

  const tokens = normalized.split(/\s+/).filter((t) => t.length >= 2);
  return [...new Set(tokens)];
}

/** Variants for tolerant Arabic matching against raw DB text. */
export function searchTextVariants(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const normalized = normalizeArabicSearchText(trimmed);
  const variants = new Set<string>([trimmed, normalized]);

  if (normalized.includes('\u0647')) {
    variants.add(normalized.replace(/\u0647/g, '\u0629'));
  }
  if (normalized.includes('\u064A')) {
    variants.add(normalized.replace(/\u064A/g, '\u0649'));
  }

  return [...variants].filter(Boolean);
}

export function isBlankSearchQuery(query: string): boolean {
  return normalizeArabicSearchText(query).length === 0;
}

export function clampSearchQuery(query: string, maxLen = 120): string {
  return query.trim().slice(0, maxLen);
}
