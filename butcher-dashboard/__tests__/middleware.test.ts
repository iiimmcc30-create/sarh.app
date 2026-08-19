import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set('cookie', cookie);
  return new NextRequest(new URL(path, 'http://localhost:3002'), { headers });
}

describe('butcher dashboard middleware', () => {
  it('redirects protected pages to /login when cookie missing', () => {
    const res = middleware(request('/dashboard'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3002/login');
  });

  it('allows /login without token', () => {
    const res = middleware(request('/login'));
    expect(res.status).toBe(200);
  });

  it('allows dashboard when butcher_token cookie is present', () => {
    const res = middleware(request('/dashboard/orders', 'butcher_token=abc123'));
    expect(res.status).toBe(200);
  });

  it('decodes URI-encoded cookie tokens', () => {
    const res = middleware(
      request('/dashboard', `butcher_token=${encodeURIComponent('tok+1')}`),
    );
    expect(res.status).toBe(200);
  });
});
