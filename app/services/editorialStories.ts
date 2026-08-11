import { API_BASE, ensureApiReachable } from '@/services/api';
import { fetchWithTimeout } from '@/services/fetchWithTimeout';

export type EditorialStory = {
  id: string;
  titleAr: string;
  bodyAr: string;
  imageUrl: string;
  duration: number;
  sortOrder: number;
  isActive: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchEditorialStories(): Promise<EditorialStory[]> {
  try {
    await ensureApiReachable();
    const res = await fetchWithTimeout(`${API_BASE}/api/editorial-stories`);
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { stories?: EditorialStory[] } };
    const stories = json?.data?.stories;
    if (!Array.isArray(stories)) return [];
    return stories;
  } catch {
    return [];
  }
}
