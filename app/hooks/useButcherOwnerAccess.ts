import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';
import { useApprovedButcherApplication } from '@/hooks/useApprovedButcherApplication';

/**
 * Whether the current user owns an active butcher shop (approved application or /butchers/me).
 */
export function useButcherOwnerAccess() {
  const { user, accessToken } = useAuth();
  const applicationState = useApprovedButcherApplication();
  const [butcherIdFromMe, setButcherIdFromMe] = useState<string | null>(null);
  const [meLoading, setMeLoading] = useState(false);

  const refreshButcherMe = useCallback(async () => {
    if (!accessToken) {
      setButcherIdFromMe(null);
      return;
    }

    setMeLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/api/butchers/me`);
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success && json.data?.id) {
        setButcherIdFromMe(String(json.data.id));
      } else {
        setButcherIdFromMe(null);
      }
    } catch {
      setButcherIdFromMe(null);
    } finally {
      setMeLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void refreshButcherMe();
  }, [refreshButcherMe]);

  const provisionedButcherId =
    applicationState.provisionedButcherId ?? butcherIdFromMe;

  const isButcherOwner =
    applicationState.hasApprovedApplication ||
    user?.role === 'BUTCHER' ||
    butcherIdFromMe !== null;

  const refresh = useCallback(async () => {
    await applicationState.refresh();
    await refreshButcherMe();
  }, [applicationState, refreshButcherMe]);

  return {
    ...applicationState,
    loading: applicationState.loading || meLoading,
    isButcherOwner,
    provisionedButcherId,
    refresh,
  };
}
