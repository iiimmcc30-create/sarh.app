// Powered by OnSpace.AI
// SAFAT — App Context (current user + global state)

import { createContext, ReactNode, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Post, Listing } from '@/services/types';
import { useAuth } from './AuthContext';
import { API_BASE, ensureApiReachable } from '@/services/api';
import { parseApiError } from '@/services/apiError';
import { sanitizeListingLimitMessage } from '@/lib/listingLimits';
import { authFetch, getAccessToken } from '@/services/authFetch';
import { fetchWithTimeout } from '@/services/fetchWithTimeout';
import { fetchPublicFeed } from '@/services/fetchPublicFeed';
import { needsUpload } from '@/services/mediaUri';
import { uploadImageFromUri } from '@/services/upload';
import { resolveCurrentUserId } from '@/lib/currentUser';
import { listingVideoUrl } from '@/lib/listingMedia';
import { resolveMediaUrl } from '@/services/media';

const BOOKMARKS_STORAGE_KEY = 'sarouh:bookmarked_posts';
const REFETCH_TTL_MS = 60_000;

let userFetchInflight: Promise<void> | null = null;
let listingsFetchInflight: Promise<void> | null = null;
let listingsLastFetchOk = false;
const postsFetchInflight = new Map<string, Promise<void>>();
const postsLastFetchOk = new Map<string, boolean>();

export type ActionResult = { ok: boolean; error?: string; listingId?: string };

const DEFAULT_USER: User = {
  id: '',
  username: '',
  displayName: '',
  arabicName: '',
  avatar: undefined,
  verified: false,
  followers: 0,
  following: 0,
  rating: null,
  reviewCount: 0,
  country: 'SA',
  bio: '',
};

interface AppContextValue {
  me: User;
  updateMe: (updates: Partial<User>) => Promise<ActionResult>;
  posts: Post[];
  fetchPosts: (feed?: 'for_you' | 'following') => Promise<boolean>;
  fetchListings: () => Promise<boolean>;
  addPost: (post: Omit<Post, 'id' | 'author' | 'likes' | 'reposts' | 'comments' | 'postedAt' | 'liked' | 'reposted'>) => Promise<boolean>;
  updatePost: (postId: string, data: { content: string; arabicContent: string; image?: string | null; images?: string[] }) => Promise<boolean>;
  deletePost: (postId: string) => Promise<ActionResult>;
  listings: Listing[];
  addListing: (listingData: any) => Promise<ActionResult>;
  updateListing: (listingId: string, listingData: any) => Promise<ActionResult>;
  likedPosts: Set<string>;
  repostedPosts: Set<string>;
  bookmarkedPosts: Set<string>;
  toggleLike: (postId: string) => Promise<void>;
  toggleRepost: (postId: string) => Promise<void>;
  toggleBookmark: (postId: string) => void;
  addComment: (postId: string, content: string) => Promise<boolean>;
  removeListing: (listingId: string) => Promise<ActionResult>;
  refetchData: (force?: boolean) => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [me, setMe] = useState<User>(DEFAULT_USER);
  const [posts, setPosts] = useState<Post[]>([]);
  const [listingsState, setListingsState] = useState<Listing[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [repostedPosts, setRepostedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());

  // Bookmarks are device-local (no backend model yet) — restore on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
        if (raw) setBookmarkedPosts(new Set(JSON.parse(raw)));
      } catch {
        /* ignore corrupt/missing storage */
      }
    })();
  }, []);

  const toggleBookmark = useCallback((postId: string) => {
    setBookmarkedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }, []);

  // Helper mapping functions
  const mapBackendUser = useCallback((u: any): User => {
    if (!u || typeof u !== 'object') return { ...DEFAULT_USER };
    return {
      id: String(u.id ?? ''),
      username: u.username || '',
      displayName: u.displayName || '',
      arabicName: u.arabicName || '',
      avatar: u.avatar || undefined,
      coverImage: u.coverImage || undefined,
      verified: u.verified ?? false,
      isAI: u.isAI ?? false,
      followers: u.followersCount ?? u.followers ?? 0,
      following: u.followingCount ?? u.following ?? 0,
      postsCount: u.postsCount ?? 0,
      rating: typeof u.rating === 'number' ? u.rating : null,
      reviewCount: u.reviewCount ?? 0,
      country: u.country || 'SA',
      bio: u.bio || '',
    };
  }, []);

  const mapBackendPost = useCallback((p: any): Post | null => {
    if (!p?.id) return null;
    return {
      id: p.id,
      author: mapBackendUser(p.author),
      content: p.content,
      arabicContent: p.arabicContent,
      image: p.image,
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : p.image ? [p.image] : undefined,
      video: p.video ?? undefined,
      likes: p.likesCount ?? 0,
      reposts: p.repostsCount ?? 0,
      comments: p.commentsCount ?? 0,
      views: typeof p.viewsCount === 'number' ? p.viewsCount : undefined,
      postedAt: new Date(p.createdAt).toLocaleDateString('ar-SA'),
      createdAt: p.createdAt,
      liked: p.liked ?? false,
      reposted: p.reposted ?? false,
    };
  }, [mapBackendUser]);

  const mapBackendListing = useCallback((l: any): Listing | null => {
    if (!l?.id) return null;
    return {
      id: l.id,
      title: l.title,
      arabicTitle: l.arabicTitle,
      price: l.price,
      currency: l.currency || 'SAR',
      category: l.category,
      categoryId: l.categoryId ?? l.marketCategory?.id,
      subcategoryId: l.subcategoryId ?? l.marketSubcategory?.id,
      categoryNameAr: l.marketCategory?.nameAr,
      subcategoryNameAr: l.marketSubcategory?.nameAr,
      breed: l.breed || '',
      age: l.age || '',
      location: l.location,
      arabicLocation: l.arabicLocation,
      country: l.country,
      contactPhone: l.contactPhone || undefined,
      weightKg: typeof l.weightKg === 'number' ? l.weightKg : undefined,
      requiresWeight:
        l.marketCategory?.requiresWeight === true ||
        l.marketSubcategory?.requiresWeight === true ||
        l.category === 'slaughter',
      images: (l.images ?? [])
        .map((uri: string) => {
          const raw = typeof uri === 'string' ? uri.trim() : '';
          return resolveMediaUrl(raw) ?? raw;
        })
        .filter((uri: string) => uri.length > 0),
      videoUrl: resolveMediaUrl(listingVideoUrl({ images: l.images, videoUrl: l.videoUrl })),
      thumbnailUrl: resolveMediaUrl(
        typeof l.thumbnailUrl === 'string' && l.thumbnailUrl.trim() ? l.thumbnailUrl : undefined,
      ),
      description: l.description,
      arabicDescription: l.arabicDescription,
      seller: mapBackendUser(l.seller),
      featured: l.featured ?? false,
      pinned: l.pinned ?? false,
      postedAt: new Date(l.createdAt).toLocaleDateString('ar-SA'),
      createdAt: l.createdAt,
      views: typeof l.views === 'number' ? l.views : undefined,
      editCount: typeof l.editCount === 'number' ? l.editCount : 0,
    };
  }, [mapBackendUser]);

  const fetchUserData = useCallback(async () => {
    const userId = resolveCurrentUserId(user);
    if (!isAuthenticated || !accessToken || !userId) return;
    if (userFetchInflight) {
      await userFetchInflight;
      return;
    }
    userFetchInflight = (async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/users/${userId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setMe(mapBackendUser(json.data));
          }
        }
      } catch (err) {
        console.warn('[AppContext] Failed to fetch user profile:', err);
      }
    })().finally(() => {
      userFetchInflight = null;
    });
    await userFetchInflight;
  }, [isAuthenticated, accessToken, user, mapBackendUser]);

  const fetchListings = useCallback(async (): Promise<boolean> => {
    if (listingsFetchInflight) {
      await listingsFetchInflight;
      return listingsLastFetchOk;
    }
    let succeeded = false;
    listingsFetchInflight = (async () => {
      try {
        const fetchList = async (url: string) => {
          const res = await fetchPublicFeed(url, accessToken);
          if (!res.ok) return null;
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.listings)) {
            return json.data.listings
              .map(mapBackendListing)
              .filter((listing: Listing | null): listing is Listing =>
                Boolean(listing && listing.country !== 'EG'),
              );
          }
          return null;
        };

        const marketPromise = fetchList(`${API_BASE}/api/listings`);
        const minePromise =
          accessToken && resolveCurrentUserId(user, me)
            ? fetchList(`${API_BASE}/api/listings?sellerId=${encodeURIComponent(resolveCurrentUserId(user, me))}`)
            : Promise.resolve([] as Listing[]);

        const [market, mine] = await Promise.all([marketPromise, minePromise]);
        if (market === null) return;

        const byId = new Map<string, Listing>();
        for (const l of [...(mine ?? []), ...market]) byId.set(l.id, l);
        setListingsState(Array.from(byId.values()));
        succeeded = true;
      } catch (err) {
        console.warn('[AppContext] Failed to fetch listings:', err);
      }
    })().finally(() => {
      listingsFetchInflight = null;
      listingsLastFetchOk = succeeded;
    });
    await listingsFetchInflight;
    return succeeded;
  }, [accessToken, user, me, mapBackendListing]);

  // Keep ownership checks working even before profile fetch finishes
  useEffect(() => {
    if (!user) {
      setMe(DEFAULT_USER);
      return;
    }
    setMe((prev) => ({
      ...prev,
      id: resolveCurrentUserId(user, prev) || prev.id,
      username: user.username || prev.username,
      displayName: user.displayName || prev.displayName,
      arabicName: user.arabicName || user.displayName || prev.arabicName,
      avatar: user.avatar ?? prev.avatar,
      verified: user.verified ?? prev.verified,
      country: (user.country as User['country']) || prev.country || 'SA',
    }));
  }, [user]);

  const fetchPosts = useCallback(async (feed: 'for_you' | 'following' = 'for_you'): Promise<boolean> => {
    const inflightKey = `${accessToken ?? 'guest'}:${feed}`;
    const inflight = postsFetchInflight.get(inflightKey);
    if (inflight) {
      await inflight;
      return postsLastFetchOk.get(inflightKey) ?? false;
    }

    let succeeded = false;
    const promise = (async () => {
      try {
        const qs = feed === 'following' ? '?feed=following' : '';
        const res = await fetchPublicFeed(`${API_BASE}/api/posts${qs}`, accessToken);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.posts) {
            const fetchedPosts = (json.data.posts as unknown[])
              .map(mapBackendPost)
              .filter((p: Post | null): p is Post => Boolean(p?.id));
            setPosts(fetchedPosts);

            const liked = new Set<string>();
            const reposted = new Set<string>();
            fetchedPosts.forEach((p: Post) => {
              if (p.liked) liked.add(p.id);
              if (p.reposted) reposted.add(p.id);
            });
            setLikedPosts(liked);
            setRepostedPosts(reposted);
            succeeded = true;
          }
        }
      } catch (err) {
        console.warn('[AppContext] Failed to fetch posts:', err);
      }
    })().finally(() => {
      postsFetchInflight.delete(inflightKey);
      postsLastFetchOk.set(inflightKey, succeeded);
    });

    postsFetchInflight.set(inflightKey, promise);
    await promise;
    return succeeded;
  }, [accessToken, mapBackendPost]);

  const lastRefetchAtRef = useRef(0);
  const refetchInflightRef = useRef<Promise<void> | null>(null);

  const refetchData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastRefetchAtRef.current < REFETCH_TTL_MS) {
      return;
    }
    if (refetchInflightRef.current && !force) {
      await refetchInflightRef.current;
      return;
    }
    lastRefetchAtRef.current = now;
    const promise = Promise.all([fetchUserData(), fetchListings(), fetchPosts()]).then(
      () => undefined,
    );
    refetchInflightRef.current = promise;
    await promise.finally(() => {
      if (refetchInflightRef.current === promise) {
        refetchInflightRef.current = null;
      }
    });
  }, [fetchUserData, fetchListings, fetchPosts]);

  const feedRetryRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({
    count: 0,
    timer: null,
  });

  const scheduleFeedRetry = useCallback(() => {
    const retry = feedRetryRef.current;
    if (retry.count >= 5 || retry.timer) return;
    retry.timer = setTimeout(() => {
      retry.timer = null;
      retry.count += 1;
      void Promise.all([fetchPosts(), fetchListings()]).then(([postsOk, listingsOk]) => {
        if (postsOk && listingsOk) {
          retry.count = 0;
        } else {
          scheduleFeedRetry();
        }
      });
    }, 4000 + retry.count * 2000);
  }, [fetchPosts, fetchListings]);

  const bootstrapFeeds = useCallback(async () => {
    await ensureApiReachable();
    const [postsOk, listingsOk] = await Promise.all([fetchPosts(), fetchListings()]);
    if (!postsOk || !listingsOk) {
      scheduleFeedRetry();
    } else {
      feedRetryRef.current.count = 0;
    }
  }, [fetchPosts, fetchListings, scheduleFeedRetry]);

  // Public feed — available to guests and logged-in users
  useEffect(() => {
    void bootstrapFeeds();
    return () => {
      const retry = feedRetryRef.current;
      if (retry.timer) {
        clearTimeout(retry.timer);
        retry.timer = null;
      }
    };
  }, [bootstrapFeeds]);

  const lastBootstrapKey = useRef<string | null>(null);

  // User profile + authenticated feed metadata (liked/reposted)
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      lastBootstrapKey.current = null;
      if (!isAuthenticated) {
        setMe(DEFAULT_USER);
        setLikedPosts(new Set());
        setRepostedPosts(new Set());
      }
      return;
    }
    const key = `${accessToken}:${user?.id ?? ''}`;
    if (lastBootstrapKey.current === key) return;
    lastBootstrapKey.current = key;
    void Promise.all([fetchUserData(), fetchPosts(), fetchListings()]);
  }, [isAuthenticated, accessToken, user?.id, fetchUserData, fetchPosts, fetchListings]);

  const updateMe = useCallback(async (updates: Partial<User>): Promise<ActionResult> => {
    if (!isAuthenticated || !accessToken || !user) {
      return { ok: false, error: 'يجب تسجيل الدخول أولاً' };
    }
    try {
      let avatar = updates.avatar;
      let coverImage = updates.coverImage;
      let uploadWarning: string | undefined;

      // Prefer live token — AppState refresh after ImagePicker can rotate access tokens.
      const uploadToken = getAccessToken() ?? accessToken;

      if (needsUpload(avatar)) {
        try {
          avatar = await uploadImageFromUri(uploadToken, avatar, 'avatars');
        } catch (err) {
          uploadWarning =
            err instanceof Error ? err.message : 'تعذّر رفع صورة الملف الشخصي';
          avatar = undefined;
        }
      }
      if (needsUpload(coverImage)) {
        try {
          coverImage = await uploadImageFromUri(
            getAccessToken() ?? uploadToken,
            coverImage,
            'avatars',
          );
        } catch (err) {
          uploadWarning =
            err instanceof Error ? err.message : 'تعذّر رفع صورة الغلاف';
          coverImage = undefined;
        }
      }

      const body: Record<string, unknown> = {};
      if (updates.displayName !== undefined) body.displayName = updates.displayName;
      if (updates.arabicName !== undefined) body.arabicName = updates.arabicName;
      if (updates.username !== undefined) body.username = updates.username;
      if (updates.bio !== undefined) body.bio = updates.bio;
      if (updates.country !== undefined) body.country = updates.country;
      if (avatar !== undefined) body.avatar = avatar;
      if (coverImage !== undefined) body.coverImage = coverImage;

      if (Object.keys(body).length === 0) {
        return {
          ok: false,
          error: uploadWarning || 'لا توجد تغييرات للحفظ',
        };
      }

      const res = await authFetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setMe(mapBackendUser(json.data));
          return uploadWarning ? { ok: true, error: uploadWarning } : { ok: true };
        }
      }
      return { ok: false, error: uploadWarning ?? (await parseApiError(res)) };
    } catch (err) {
      console.warn('[AppContext] Update user profile failed:', err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'فشل حفظ التغييرات',
      };
    }
  }, [isAuthenticated, accessToken, user, mapBackendUser]);

  const addPost = useCallback(async (postData: Omit<Post, 'id' | 'author' | 'likes' | 'reposts' | 'comments' | 'postedAt' | 'liked'>): Promise<boolean> => {
    if (!isAuthenticated || !accessToken) return false;
    try {
      const res = await authFetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const mapped = mapBackendPost(json.data);
          if (mapped) setPosts((prev) => [mapped, ...prev]);
          return Boolean(mapped);
        }
      }
    } catch (err) {
      console.warn('[AppContext] Add post failed:', err);
    }
    return false;
  }, [isAuthenticated, accessToken, mapBackendPost]);

  const addListing = useCallback(async (listingData: any): Promise<ActionResult> => {
    if (!isAuthenticated || !accessToken) {
      return { ok: false, error: 'يجب تسجيل الدخول أولاً' };
    }
    try {
      const res = await authFetch(`${API_BASE}/api/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const mapped = mapBackendListing(json.data);
          if (mapped) setListingsState((prev) => [mapped, ...prev]);
          return mapped ? { ok: true, listingId: mapped.id } : { ok: false, error: 'استجابة غير صالحة' };
        }
      }
      return { ok: false, error: sanitizeListingLimitMessage(await parseApiError(res)) };
    } catch (err) {
      console.warn('[AppContext] Add listing failed:', err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'فشل نشر الإعلان',
      };
    }
  }, [isAuthenticated, accessToken, mapBackendListing]);

  const updateListing = useCallback(async (listingId: string, listingData: any): Promise<ActionResult> => {
    if (!isAuthenticated || !accessToken) {
      return { ok: false, error: 'يجب تسجيل الدخول أولاً' };
    }
    try {
      const res = await authFetch(`${API_BASE}/api/listings/${listingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const mapped = mapBackendListing(json.data);
          if (mapped) {
            setListingsState((prev) => prev.map((item) => (item.id === listingId ? mapped : item)));
            return { ok: true, listingId: mapped.id };
          }
          return { ok: false, error: 'استجابة غير صالحة' };
        }
      }
      return { ok: false, error: sanitizeListingLimitMessage(await parseApiError(res)) };
    } catch (err) {
      console.warn('[AppContext] Update listing failed:', err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'فشل تعديل الإعلان',
      };
    }
  }, [isAuthenticated, accessToken, mapBackendListing]);

  const removeListing = useCallback(async (listingId: string): Promise<ActionResult> => {
    if (!isAuthenticated || !accessToken) {
      return { ok: false, error: 'يجب تسجيل الدخول أولاً' };
    }
    try {
      const res = await authFetch(`${API_BASE}/api/listings/${listingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setListingsState((prev) => prev.filter((l) => l.id !== listingId));
        return { ok: true };
      }
      return { ok: false, error: await parseApiError(res) };
    } catch (err) {
      console.warn('[AppContext] Delete listing failed:', err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'فشل حذف الإعلان',
      };
    }
  }, [isAuthenticated, accessToken]);

  const toggleLike = useCallback(async (postId: string) => {
    if (!isAuthenticated || !accessToken) return;
    try {
      const res = await authFetch(`${API_BASE}/api/posts/${postId}/like`, {
        method: 'POST',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const isLikedNow = Boolean(json.data?.liked);
          setLikedPosts((prev) => {
            const next = new Set(prev);
            if (isLikedNow) {
              next.add(postId);
            } else {
              next.delete(postId);
            }
            return next;
          });

          setPosts((prev) =>
            prev.map((p) => {
              if (p.id === postId) {
                return {
                  ...p,
                  likes: isLikedNow ? p.likes + 1 : Math.max(0, p.likes - 1),
                  liked: isLikedNow,
                };
              }
              return p;
            }),
          );
        }
      }
    } catch (err) {
      console.warn('[AppContext] Toggle like failed:', err);
    }
  }, [isAuthenticated, accessToken]);

  const toggleRepost = useCallback(async (postId: string) => {
    if (!isAuthenticated || !accessToken) return;
    try {
      const res = await authFetch(`${API_BASE}/api/posts/${postId}/repost`, {
        method: 'POST',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const isRepostedNow = Boolean(json.data?.reposted);
          setRepostedPosts((prev) => {
            const next = new Set(prev);
            if (isRepostedNow) next.add(postId);
            else next.delete(postId);
            return next;
          });
          setPosts((prev) =>
            prev.map((p) => {
              if (p.id !== postId) return p;
              return {
                ...p,
                reposts: isRepostedNow ? p.reposts + 1 : Math.max(0, p.reposts - 1),
                reposted: isRepostedNow,
              };
            }),
          );
        }
      }
    } catch (err) {
      console.warn('[AppContext] Toggle repost failed:', err);
    }
  }, [isAuthenticated, accessToken]);

  const addComment = useCallback(async (postId: string, content: string): Promise<boolean> => {
    if (!isAuthenticated || !accessToken || !content.trim()) return false;
    try {
      const res = await authFetch(`${API_BASE}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p)),
          );
          return true;
        }
      }
    } catch (err) {
      console.warn('[AppContext] Add comment failed:', err);
    }
    return false;
  }, [isAuthenticated, accessToken]);

  const updatePost = useCallback(async (
    postId: string,
    data: { content: string; arabicContent: string; image?: string | null; images?: string[] },
  ): Promise<boolean> => {
    if (!isAuthenticated || !accessToken) return false;
    try {
      const res = await authFetch(`${API_BASE}/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    content: json.data.content,
                    arabicContent: json.data.arabicContent,
                    image: json.data.image ?? p.image,
                    images:
                      Array.isArray(json.data.images) && json.data.images.length > 0
                        ? json.data.images
                        : json.data.image
                          ? [json.data.image]
                          : p.images,
                  }
                : p,
            ),
          );
          return true;
        }
      }
    } catch (err) {
      console.warn('[AppContext] Update post failed:', err);
    }
    return false;
  }, [isAuthenticated, accessToken]);

  const deletePost = useCallback(async (postId: string): Promise<ActionResult> => {
    if (!isAuthenticated || !accessToken) {
      return { ok: false, error: 'يجب تسجيل الدخول أولاً' };
    }
    try {
      const res = await authFetch(`${API_BASE}/api/posts/${postId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setLikedPosts((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        setRepostedPosts((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        return { ok: true };
      }
      return { ok: false, error: await parseApiError(res) };
    } catch (err) {
      console.warn('[AppContext] Delete post failed:', err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'فشل حذف المنشور',
      };
    }
  }, [isAuthenticated, accessToken]);

  const value = useMemo<AppContextValue>(
    () => ({
      me,
      updateMe,
      posts,
      fetchPosts,
      fetchListings,
      addPost,
      updatePost,
      deletePost,
      listings: listingsState,
      addListing,
      updateListing,
      likedPosts,
      repostedPosts,
      bookmarkedPosts,
      toggleLike,
      toggleRepost,
      toggleBookmark,
      addComment,
      removeListing,
      refetchData,
    }),
    [
      me,
      updateMe,
      posts,
      fetchPosts,
      fetchListings,
      addPost,
      updatePost,
      deletePost,
      listingsState,
      addListing,
      updateListing,
      likedPosts,
      repostedPosts,
      bookmarkedPosts,
      toggleLike,
      toggleRepost,
      toggleBookmark,
      addComment,
      removeListing,
      refetchData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
