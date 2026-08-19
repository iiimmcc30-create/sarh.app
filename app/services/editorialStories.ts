import { API_BASE } from '@/services/api';
import { fetchWithTimeout } from '@/services/fetchWithTimeout';
import { FEED_TIMEOUT_MS } from '@/services/fetchPublicFeed';

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
    const res = await fetchWithTimeout(`${API_BASE}/api/editorial-stories`, {}, FEED_TIMEOUT_MS);
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { stories?: EditorialStory[] } };
    const stories = json?.data?.stories;
    if (!Array.isArray(stories)) return [];
    return stories;
  } catch {
    return [];
  }
}
