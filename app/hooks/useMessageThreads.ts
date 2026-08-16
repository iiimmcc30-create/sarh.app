import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';

export type MessageThreadType = 'DIRECT' | 'BUTCHER';

export type MessageThreadFilter = 'all' | 'unread' | 'transactions' | 'requests';

export interface MessageThreadItem {
  id: string;
  type: MessageThreadType;
  butcherId?: string | null;
  butcher?: {
    id: string;
    nameAr: string;
    nameEn?: string;
    logo?: string | null;
  } | null;
  participant: {
    id: string;
    displayName: string;
    arabicName: string;
    avatar?: string;
    verified: boolean;
  } | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unread: number;
  isMine?: boolean;
}

function mapThread(t: any, fallbackType: MessageThreadType): MessageThreadItem {
  return {
    id: t.id,
    type: (t.type as MessageThreadType) || fallbackType,
    butcherId: t.butcherId ?? null,
    butcher: t.butcher
      ? {
          id: t.butcher.id,
          nameAr: t.butcher.nameAr,
          nameEn: t.butcher.nameEn,
          logo: t.butcher.logo,
        }
      : null,
    participant: t.participant
      ? {
          id: t.participant.id,
          displayName:
            t.participant.displayName || t.participant.username || '',
          arabicName:
            t.participant.arabicName || t.participant.displayName || '',
          avatar: t.participant.avatar || undefined,
          verified: t.participant.verified ?? false,
        }
      : null,
    lastMessage: t.lastMessage,
    lastMessageAt: t.lastMessageAt,
    unread: t.unread ?? 0,
    isMine: Boolean(t.isMine),
  };
}

async function fetchType(
  accessToken: string,
  type: MessageThreadType,
): Promise<MessageThreadItem[]> {
  const res = await authFetch(
    `${API_BASE}/api/messages?type=${encodeURIComponent(type)}`,
  );
  if (res.status === 401) {
    throw new Error('unauthorized');
  }
  if (!res.ok) throw new Error('fetch_failed');
  const json = await res.json();
  if (!json.success || !Array.isArray(json.data)) throw new Error('fetch_failed');
  return json.data.map((t: any) => mapThread(t, type));
}

export function useMessageThreads(
  accessToken: string | null,
  type: MessageThreadType | 'ALL' = 'ALL',
) {
  const [threads, setThreads] = useState<MessageThreadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!accessToken) {
      setThreads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (type === 'ALL') {
        const [direct, butcher] = await Promise.all([
          fetchType(accessToken, 'DIRECT'),
          fetchType(accessToken, 'BUTCHER'),
        ]);
        const merged = [...direct, ...butcher].sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime(),
        );
        setThreads(merged);
      } else {
        setThreads(await fetchType(accessToken, type));
      }
    } catch (err) {
      const code = err instanceof Error ? err.message : 'fetch_failed';
      setError(code === 'unauthorized' ? 'unauthorized' : 'fetch_failed');
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, type]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return { threads, loading, error, refetch: fetchThreads };
}

export function filterMessageThreads(
  threads: MessageThreadItem[],
  filter: MessageThreadFilter,
  search: string,
  listingTitlesByPeer: Record<string, string | undefined>,
): MessageThreadItem[] {
  const q = search.trim().toLowerCase();

  return threads.filter((t) => {
    if (filter === 'unread' && t.unread <= 0) return false;
    if (filter === 'transactions' && t.type !== 'BUTCHER') return false;
    if (filter === 'requests' && t.type !== 'DIRECT') return false;

    if (!q) return true;

    const p = t.participant;
    const butcherName = t.butcher?.nameAr ?? '';
    const listingTitle = p?.id ? listingTitlesByPeer[p.id] ?? '' : '';
    const haystack = [
      p?.displayName ?? '',
      p?.arabicName ?? '',
      butcherName,
      t.lastMessage ?? '',
      listingTitle,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}
