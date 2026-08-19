'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { ACCESS_TOKEN_KEY } from '@/services/api.client';
import {
  eventBelongsToButcher,
  notifyAllLiveRefreshDebounced,
} from '@/lib/live-refresh';

const USER_EVENTS = [
  'order.created',
  'order.updated',
  'order.cancelled',
  'order.timeline.updated',
  'order:updated',
  'inventory.updated',
] as const;

function resolveSocketUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://127.0.0.1:3002';
  return raw.replace(/\/$/, '').replace('localhost', '127.0.0.1');
}

export function useButcherLiveSocket(butcherId: string | null) {
  const butcherIdRef = useRef(butcherId);
  butcherIdRef.current = butcherId;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return undefined;

    const socket: Socket = io(resolveSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
    });

    const onEvent = (payload: unknown) => {
      if (!eventBelongsToButcher(payload, butcherIdRef.current)) return;
      notifyAllLiveRefreshDebounced();
    };

    for (const event of USER_EVENTS) {
      socket.on(event, onEvent);
    }

    return () => {
      for (const event of USER_EVENTS) {
        socket.off(event, onEvent);
      }
      socket.disconnect();
    };
  }, []);
}
