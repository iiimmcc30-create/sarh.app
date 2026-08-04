import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';

export type CommentDeleteResult =
  | { ok: true }
  | { ok: false; message: string };

async function deleteCommentRequest(url: string): Promise<CommentDeleteResult> {
  try {
    const res = await authFetch(url, { method: 'DELETE' });
    const json = await res.json().catch(() => ({} as Record<string, unknown>));

    if (res.ok && json.success !== false) {
      return { ok: true };
    }

    const message =
      (typeof json.messageAr === 'string' && json.messageAr.trim()) ||
      (typeof json.message === 'string' && json.message.trim()) ||
      (res.status === 401 ? 'يجب تسجيل الدخول' : 'تعذّر حذف التعليق');

    return { ok: false, message };
  } catch {
    return { ok: false, message: 'تعذّر حذف التعليق — تحقق من الاتصال' };
  }
}

export async function deletePostComment(
  postId: string,
  commentId: string,
): Promise<CommentDeleteResult> {
  return deleteCommentRequest(`${API_BASE}/api/posts/${postId}/comments/${commentId}`);
}

export async function deleteListingComment(
  listingId: string,
  commentId: string,
): Promise<CommentDeleteResult> {
  return deleteCommentRequest(`${API_BASE}/api/listings/${listingId}/comments/${commentId}`);
}
