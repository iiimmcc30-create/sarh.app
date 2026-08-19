import { apiClient, unwrap } from './api.client';

export type ButcherProfile = {
  id: string;
  userId: string;
  nameAr: string;
  nameEn: string;
  logo: string | null;
  cover: string | null;
  isOpen: boolean;
  phone: string;
  cityAr: string;
  city: string;
};

export async function fetchMyButcher(): Promise<ButcherProfile> {
  const res = await apiClient.get('/butchers/me');
  return unwrap<ButcherProfile>(res);
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiClient.get('/notifications/unread-count');
  const data = unwrap<{ unreadCount: number }>(res);
  return data.unreadCount;
}
