import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionTokenEdge } from '@/lib/session-edge';

/**
 * Gate for /admin. The session cookie's HMAC is verified here, before any admin
 * route renders — a check in the layout alone is not enough, because React has
 * already started streaming by the time a layout-level redirect() resolves.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();

  const session = await verifySessionTokenEdge(
    req.cookies.get('wr_admin')?.value,
    process.env.AUTH_SECRET
  );

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    url.searchParams.set('next', pathname);
    const res = NextResponse.redirect(url);
    // Clear an invalid or expired cookie so the browser stops resending it.
    res.cookies.delete('wr_admin');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
