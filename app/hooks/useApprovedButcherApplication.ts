import { useButcherOwnerContext } from '@/contexts/ButcherOwnerContext';

/** Reads butcher application state from the shared ButcherOwnerProvider. */
export function useApprovedButcherApplication() {
  const ctx = useButcherOwnerContext();
  return {
    loading: ctx.loading,
    applications: ctx.applications,
    approvedApplication: ctx.approvedApplication,
    hasApprovedApplication: ctx.hasApprovedApplication,
    hasAnyApplication: ctx.hasAnyApplication,
    hasPendingApplication: ctx.hasPendingApplication,
    provisionedButcherId: ctx.provisionedButcherId,
    refresh: ctx.refresh,
  };
}
