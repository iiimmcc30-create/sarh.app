import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set('cookie', cookie);
  return new NextRequest(new URL(path, 'http://localhost:3000'), { headers });
}

describe('admin middleware auth gate', () => {
  it('redirects protected pages to /login when cookie missing', () => {
    const res = middleware(request('/users'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('allows /login without token so client can restore or clear session', () => {
    const res = middleware(request('/login'));
    expect(res.status).toBe(200);
  });

  it('allows dashboard when admin_token cookie is present', () => {
    const res = middleware(request('/listings', 'admin_token=abc123'));
    expect(res.status).toBe(200);
  });

  it('decodes URI-encoded cookie tokens', () => {
    const res = middleware(request('/orders', `admin_token=${encodeURIComponent('tok+1')}`));
    expect(res.status).toBe(200);
  });

  it('protects nested support and plan routes', () => {
    expect(middleware(request('/support/tickets/1')).headers.get('location')).toContain('/login');
    expect(middleware(request('/plans/p1')).headers.get('location')).toContain('/login');
  });
});
