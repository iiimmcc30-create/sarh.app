export type ListingsPageMeta = {
  nextCursor: string | null;
  hasMore: boolean;
};

export function mergeListingsById<T extends { id: string }>(
  existing: T[],
  incoming: T[],
): T[] {
  if (incoming.length === 0) return existing;
  if (existing.length === 0) return incoming.slice();
  const seen = new Set(existing.map((item) => item.id));
  const next = existing.slice();
  for (const item of incoming) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      next.push(item);
    }
  }
  return next;
}

/** Walk cursor pages (same shape as GET /api/listings) without fetching everything at once. */
export function accumulateListingPages<T extends { id: string }>(
  pages: Array<{ listings: T[]; nextCursor: string | null; hasMore: boolean }>,
): T[] {
  return pages.reduce<T[]>((acc, page) => mergeListingsById(acc, page.listings), []);
}
