import { ADMIN_BASE_PATH, withAdminBase } from '@/constants/adminBasePath';

describe('admin base path helper', () => {
  it('leaves local paths unchanged when base path is empty', () => {
    expect(ADMIN_BASE_PATH).toBe('');
    expect(withAdminBase('/login')).toBe('/login');
    expect(withAdminBase('/')).toBe('/');
  });
});
