import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { signAdminAccessToken } from '@/lib/admin-jwt';

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set('cookie', cookie);
  return new NextRequest(new URL(path, 'http://localhost:3000'), { headers });
}

describe('admin middleware auth gate', () => {
  const secret = 'test-admin-jwt-secret-minimum-32-chars!!';

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
  });

  it('redirects protected pages to /login when cookie missing', async () => {
    const res = await middleware(request('/users'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('allows /login without token so client can restore or clear session', async () => {
    const res = await middleware(request('/login'));
    expect(res.status).toBe(200);
  });

  it('redirects when cookie is not a valid JWT', async () => {
    const res = await middleware(request('/listings', 'admin_token=abc123'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('redirects expired staff tokens', async () => {
    const token = await signAdminAccessToken({
      secret,
      role: 'ADMIN',
      expiresInSec: -10,
    });
    const res = await middleware(
      request('/orders', `admin_token=${encodeURIComponent(token)}`),
    );
    expect(res.status).toBe(307);
  });

  it('allows a valid ADMIN token', async () => {
    const token = await signAdminAccessToken({ secret, role: 'ADMIN' });
    const res = await middleware(
      request('/listings', `admin_token=${encodeURIComponent(token)}`),
    );
    expect(res.status).toBe(200);
  });

  it('allows a valid MODERATOR token', async () => {
    const token = await signAdminAccessToken({ secret, role: 'MODERATOR' });
    const res = await middleware(
      request('/users', `admin_token=${encodeURIComponent(token)}`),
    );
    expect(res.status).toBe(200);
  });

  it('denies a valid JWT with a non-staff role', async () => {
    const token = await signAdminAccessToken({ secret, role: 'USER' });
    const res = await middleware(
      request('/users', `admin_token=${encodeURIComponent(token)}`),
    );
    expect(res.status).toBe(307);
  });

  it('protects nested support and plan routes', async () => {
    const missing = await middleware(request('/support/tickets/1'));
    expect(missing.headers.get('location')).toContain('/login');
    const missingPlans = await middleware(request('/plans/p1'));
    expect(missingPlans.headers.get('location')).toContain('/login');
  });

  it('redirects when JWT_SECRET is not configured', async () => {
    delete process.env.JWT_SECRET;
    const token = await signAdminAccessToken({ secret, role: 'ADMIN' });
    const res = await middleware(
      request('/users', `admin_token=${encodeURIComponent(token)}`),
    );
    expect(res.status).toBe(307);
  });
});
