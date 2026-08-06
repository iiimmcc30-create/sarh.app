import { router } from 'expo-router';
import { requestListingCovenant } from '@/lib/listingCovenant';

/** Navigate to create listing after معاهدة سرح (skipped for edit flow). */
export async function navigateToCreateListing(options?: { editId?: string }) {
  if (options?.editId) {
    router.push({
      pathname: '/create/listing',
      params: { editId: options.editId },
    } as never);
    return;
  }

  const accepted = await requestListingCovenant();
  if (accepted) {
    router.push('/create/listing' as never);
  }
}
