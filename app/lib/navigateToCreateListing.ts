import { router } from 'expo-router';
import { requestListingCovenant } from '@/lib/listingCovenant';
import { isNavigationLocked, safePush } from '@/lib/safeNavigate';

/** Navigate to create listing after معاهدة سرح (skipped for edit flow). */
export async function navigateToCreateListing(options?: { editId?: string }) {
  if (isNavigationLocked()) return;

  if (options?.editId) {
    safePush(
      {
        pathname: '/create/listing',
        params: { editId: options.editId },
      },
      undefined,
      router,
    );
    return;
  }

  const accepted = await requestListingCovenant();
  if (accepted) {
    safePush('/create/listing', undefined, router);
  }
}
