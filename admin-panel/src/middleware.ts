import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawToken = request.cookies.get('admin_token')?.value;
  const token = rawToken ? decodeURIComponent(rawToken) : undefined;
  const isLogin = pathname.startsWith('/login');

  // Login page validates/restores sessions client-side; stale cookies must not
  // bounce users away before the page can clear or refresh them.
  if (!token && !isLogin) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
