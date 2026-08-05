import { API_BASE } from '@/services/api';
import { parseApiError } from '@/services/apiError';
import { authFetch } from '@/services/authFetch';

export type BlockResult =
  | { ok: true; blocked: boolean }
  | { ok: false; message: string };

export type PublicUserProfile = {
  id: string;
  username: string;
  displayName: string;
  arabicName: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  verified: boolean;
  country?: string;
  role?: string;
  /** Derived: USER | BUTCHER | LIVESTOCK_TRADER */
  accountType?: 'USER' | 'BUTCHER' | 'LIVESTOCK_TRADER';
  /** Account rating average (1–5), null when no reviews yet */
  rating: number | null;
  reviewCount: number;
  /** The current viewer's own rating of this account, if any (editable) */
  myRating?: number | null;
  followersCount: number;
  followingCount: number;
  listingsCount: number;
  postsCount: number;
  isFollowing: boolean;
  isBlocked?: boolean;
};

export async function fetchUserProfile(userId: string): Promise<PublicUserProfile | null> {
  const res = await authFetch(`${API_BASE}/api/users/${userId}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.success || !json.data) return null;
  if (typeof json.data.isFollowing !== 'boolean') {
    console.warn('[Follow] profile response omitted boolean isFollowing', {
      userId,
      value: json.data.isFollowing,
    });
    return null;
  }
  return json.data as PublicUserProfile;
}

export type ConnectionUser = {
  id: string;
  username: string;
  displayName: string;
  arabicName: string;
  avatar?: string;
  verified: boolean;
  isFollowing: boolean;
};

export async function fetchUserConnections(
  userId: string,
  type: 'followers' | 'following',
): Promise<ConnectionUser[]> {
  const res = await authFetch(`${API_BASE}/api/users/${userId}/connections?type=${type}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) return [];
  const json = await res.json();
  if (!json.success || !json.data?.users) return [];
  if (
    !Array.isArray(json.data.users) ||
    json.data.users.some((user: { isFollowing?: unknown }) => typeof user.isFollowing !== 'boolean')
  ) {
    console.warn('[Follow] connections response omitted boolean isFollowing', {
      userId,
      type,
    });
    return [];
  }
  return json.data.users as ConnectionUser[];
}

export async function setFollowUser(
  userId: string,
  following: boolean,
): Promise<{ following: boolean } | null> {
  const res = await authFetch(`${API_BASE}/api/users/${userId}/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ following }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.success) return null;
  if (typeof json.data?.following !== 'boolean') {
    console.warn('[Follow] mutation response omitted boolean following', { userId });
    return null;
  }
  return json.data as { following: boolean };
}

export type RateUserResult = {
  rating: number | null;
  reviewCount: number;
  myRating: number;
};

/** Rate another user's account (1–5 stars). One rating per reviewer — calling again edits it. */
export async function rateUser(userId: string, rating: number): Promise<RateUserResult | null> {
  const res = await authFetch(`${API_BASE}/api/users/${userId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.success) return null;
  return json.data as RateUserResult;
}

export type BlockedUser = {
  id: string;
  username: string;
  displayName: string;
  arabicName: string;
  avatar?: string;
  verified: boolean;
  blockedAt: string;
};

export async function fetchBlockedUsers(): Promise<BlockedUser[]> {
  const res = await authFetch(`${API_BASE}/api/users/blocked`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) return [];
  const json = await res.json();
  if (!json.success || !Array.isArray(json.data?.users)) return [];
  return json.data.users as BlockedUser[];
}

export async function setBlockUser(
  userId: string,
  blocked: boolean,
): Promise<BlockResult> {
  if (!userId?.trim()) {
    return { ok: false, message: 'معرّف المستخدم غير صالح' };
  }

  try {
    const res = await authFetch(`${API_BASE}/api/users/${encodeURIComponent(userId.trim())}/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked }),
    });
    const json = await res.json().catch(() => ({} as Record<string, unknown>));
    if (res.ok && json.success !== false && typeof json.data?.blocked === 'boolean') {
      return { ok: true, blocked: json.data.blocked as boolean };
    }

    if (res.status === 401) {
      return { ok: false, message: 'يجب تسجيل الدخول' };
    }

    const message = await parseApiError(
      new Response(JSON.stringify(json), { status: res.status }),
    );
    return { ok: false, message };
  } catch {
    return { ok: false, message: 'تعذّر الاتصال بالخادم' };
  }
}
