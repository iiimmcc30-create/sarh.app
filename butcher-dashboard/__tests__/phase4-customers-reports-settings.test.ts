import { fetchButcherCustomers } from '@/services/customers.service';
import { fetchButcherReports } from '@/services/reports.service';
import { updateMyButcher } from '@/services/butcher.service';
import { apiClient } from '@/services/api.client';

jest.mock('@/services/api.client', () => ({
  apiClient: { get: jest.fn(), put: jest.fn() },
  unwrap: (res: { data: { success: boolean; data: unknown } }) => res.data.data,
}));

describe('Phase 4 dashboard clients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads customers without a client butcherId', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, hasMore: false },
      },
    });
    await fetchButcherCustomers({ page: 1, limit: 20, q: 'أحمد' });
    expect(apiClient.get).toHaveBeenCalledWith('/butchers/customers', {
      params: { page: '1', limit: '20', q: 'أحمد' },
    });
    expect(apiClient.get.mock.calls[0][1].params).not.toHaveProperty('butcherId');
  });

  it('loads reports without a client butcherId', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: { salesTotal: 0, definition: { labelAr: 'x' } },
      },
    });
    await fetchButcherReports({ period: '7d' });
    expect(apiClient.get).toHaveBeenCalledWith('/butchers/reports', {
      params: { period: '7d', from: undefined, to: undefined },
    });
    expect(apiClient.get.mock.calls[0][1].params).not.toHaveProperty('butcherId');
  });

  it('saves settings through PUT /butchers/me', async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({
      data: { success: true, data: { id: 'a', nameAr: 'ملحمة' } },
    });
    await updateMyButcher({ nameAr: 'ملحمة', isOpen: true });
    expect(apiClient.put).toHaveBeenCalledWith('/butchers/me', {
      nameAr: 'ملحمة',
      isOpen: true,
    });
  });
});
