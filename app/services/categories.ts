import { API_BASE } from './api';

export type MarketCategory = {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  slug: string;
  icon?: string | null;
  emoji?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  requiresWeight: boolean;
  legacyCategory?: string | null;
  children?: MarketCategory[];
};

async function readJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.success || !json.data) return null;
  return json.data as T;
}

export async function fetchMarketCategories(): Promise<MarketCategory[]> {
  const res = await fetch(`${API_BASE}/api/categories`, { cache: 'no-store' });
  const data = await readJson<{ categories: MarketCategory[] }>(res);
  return data?.categories ?? [];
}

export async function fetchMarketCategory(id: string): Promise<MarketCategory | null> {
  const res = await fetch(`${API_BASE}/api/categories/${id}`, { cache: 'no-store' });
  const data = await readJson<{ category: MarketCategory }>(res);
  return data?.category ?? null;
}

export async function fetchMarketSubcategories(id: string): Promise<MarketCategory[]> {
  const res = await fetch(`${API_BASE}/api/categories/${id}/subcategories`, {
    cache: 'no-store',
  });
  const data = await readJson<{ subcategories: MarketCategory[] }>(res);
  return data?.subcategories ?? [];
}
