import { formatRelativeTimeAr } from '@/lib/formatRelativeTime';
import type { PostComment } from '@/services/types';

export function mapListingComment(c: {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    arabicName: string;
    avatar?: string | null;
    verified?: boolean;
  };
}): PostComment {
  return {
    id: c.id,
    content: c.content,
    createdAt:
      formatRelativeTimeAr(c.createdAt) || new Date(c.createdAt).toLocaleString('ar-SA'),
    author: {
      id: c.author.id,
      username: c.author.username,
      displayName: c.author.displayName || '',
      arabicName: c.author.arabicName || '',
      avatar: c.author.avatar ?? undefined,
      verified: c.author.verified ?? false,
      followers: 0,
      following: 0,
      rating: null,
      country: 'SA',
      bio: '',
    },
  };
}

export async function fetchListingComments(listingId: string): Promise<{
  comments: PostComment[];
  error: string | null;
}> {
  try {
    const { API_BASE } = await import('@/services/api');
    const res = await fetch(`${API_BASE}/api/listings/${listingId}/comments`);
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      const rows = Array.isArray(json.data?.comments) ? json.data.comments : [];
      return { comments: rows.map(mapListingComment), error: null };
    }
    return {
      comments: [],
      error: json.messageAr ?? json.message ?? 'تعذّر تحميل التعليقات',
    };
  } catch {
    return { comments: [], error: 'تعذّر تحميل التعليقات — تحقق من الاتصال' };
  }
}
