/**
 * @jest-environment jsdom
 */
import { apiClient } from '@/services/api.client';
import {
  FORBIDDEN_ROLE_MESSAGE,
  loginAndRequireButcher,
  platformLogin,
  tryRestoreSession,
} from '@/services/auth.service';
import { fetchMyButcher } from '@/services/butcher.service';

jest.mock('@/services/api.client', () => ({
  apiClient: { post: jest.fn(), get: jest.fn() },
  unwrap: (res: { data: { success: boolean; data: unknown } }) => res.data.data,
  ACCESS_TOKEN_KEY: 'butcher_access_token',
  REFRESH_TOKEN_KEY: 'butcher_refresh_token',
  USER_KEY: 'butcher_user',
  BUTCHER_KEY: 'butcher_profile',
  SESSION_COOKIE: 'butcher_token',
  getApiErrorMessage: () => 'x',
  isNoButcherProfileError: () => false,
}));

jest.mock('@/services/butcher.service', () => ({
  fetchMyButcher: jest.fn(),
}));

function b64urlJson(value: unknown): string {
  const json = JSON.stringify(value);
  const b64 = btoa(json);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/** Unsigned JWT whose payload role is readable by peekAccessTokenRole / restore gate. */
function jwtWithRole(role: string): string {
  return `${b64urlJson({ alg: 'HS256', typ: 'JWT' })}.${b64urlJson({
    userId: 'u1',
    role,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.sig`;
}

function butcherUser(role: string) {
  return {
    id: 'u1',
    username: 'hraj',
    email: null,
    displayName: 'Hraj',
    arabicName: 'حراج',
    avatar: null,
    role,
  };
}

describe('platformLogin identifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.cookie = 'butcher_token=; path=/; max-age=0';
  });

  it('sends Saudi 05 numbers as +966 to POST /auth/login', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: { user: butcherUser('BUTCHER'), accessToken: 'a', refreshToken: 'r' },
      },
    });
    await platformLogin('0512345678', 'secret12');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      login: '+966512345678',
      password: 'secret12',
    });
  });
});

describe('loginAndRequireButcher role gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.cookie = 'butcher_token=; path=/; max-age=0';
  });

  it('rejects USER role before persisting session (prevents middleware redirect loop)', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: {
          user: butcherUser('USER'),
          accessToken: 'user-token',
          refreshToken: 'refresh',
        },
      },
    });

    await expect(loginAndRequireButcher('0500000001', 'pass')).rejects.toThrow(
      FORBIDDEN_ROLE_MESSAGE,
    );
    expect(fetchMyButcher).not.toHaveBeenCalled();
    expect(localStorage.getItem('butcher_access_token')).toBeNull();
    expect(document.cookie).not.toContain('butcher_token=user-token');
  });

  it('persists session and butcher when role is BUTCHER', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: {
          user: butcherUser('BUTCHER'),
          accessToken: 'butcher-token',
          refreshToken: 'refresh',
        },
      },
    });
    (fetchMyButcher as jest.Mock).mockResolvedValue({
      id: 'b1',
      userId: 'u1',
      nameAr: 'ملحمة',
      nameEn: 'Butcher',
      logo: null,
      cover: null,
      isOpen: true,
      phone: '+966500000001',
      cityAr: 'الرياض',
      city: 'Riyadh',
    });

    const result = await loginAndRequireButcher('0500000001', 'pass');
    expect(result.session.user.role).toBe('BUTCHER');
    expect(localStorage.getItem('butcher_access_token')).toBe('butcher-token');
    expect(fetchMyButcher).toHaveBeenCalledTimes(1);
  });
});

describe('tryRestoreSession role gate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.cookie = 'butcher_token=; path=/; max-age=0';
  });

  it('clears session and returns forbidden_role for USER JWT (breaks login↔dashboard loop)', async () => {
    const token = jwtWithRole('USER');
    localStorage.setItem('butcher_access_token', token);
    localStorage.setItem('butcher_user', JSON.stringify(butcherUser('USER')));

    await expect(tryRestoreSession()).resolves.toBe('forbidden_role');
    expect(fetchMyButcher).not.toHaveBeenCalled();
    expect(localStorage.getItem('butcher_access_token')).toBeNull();
  });

  it('clears session from JWT payload role when USER_KEY is missing', async () => {
    const token = jwtWithRole('USER');
    localStorage.setItem('butcher_access_token', token);

    await expect(tryRestoreSession()).resolves.toBe('forbidden_role');
    expect(fetchMyButcher).not.toHaveBeenCalled();
    expect(localStorage.getItem('butcher_access_token')).toBeNull();
  });

  it('restores when role is BUTCHER and /butchers/me succeeds', async () => {
    const token = jwtWithRole('BUTCHER');
    localStorage.setItem('butcher_access_token', token);
    localStorage.setItem('butcher_user', JSON.stringify(butcherUser('BUTCHER')));
    (fetchMyButcher as jest.Mock).mockResolvedValue({
      id: 'b1',
      userId: 'u1',
      nameAr: 'ملحمة',
      nameEn: 'Butcher',
      logo: null,
      cover: null,
      isOpen: true,
      phone: '+966500000001',
      cityAr: 'الرياض',
      city: 'Riyadh',
    });

    await expect(tryRestoreSession()).resolves.toBe('restored');
    expect(fetchMyButcher).toHaveBeenCalledTimes(1);
  });
});
