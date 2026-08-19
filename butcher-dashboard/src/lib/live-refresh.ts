type Handler = () => void;

const listeners = new Map<string, Set<Handler>>();

export type LiveTopic = 'orders' | 'dashboard';

export function subscribeLiveRefresh(topic: LiveTopic, handler: Handler): () => void {
  const set = listeners.get(topic) ?? new Set<Handler>();
  set.add(handler);
  listeners.set(topic, set);
  return () => {
    set.delete(handler);
  };
}

/** Phase 3 sockets should call this instead of rebuilding pages. */
export function notifyLiveRefresh(topic: LiveTopic): void {
  listeners.get(topic)?.forEach((handler) => handler());
}

export function notifyAllLiveRefresh(): void {
  notifyLiveRefresh('orders');
  notifyLiveRefresh('dashboard');
}
