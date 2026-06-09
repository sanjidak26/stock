import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role;

    // Admin-only routes
    if (pathname.startsWith('/admin') && role !== 'central_admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Shop routes — redirect admins to admin dashboard
    const shopRoutes = ['/dashboard', '/stock', '/billing', '/bills', '/dealers', '/analytics', '/ai', '/settings'];
    if (shopRoutes.some((r) => pathname.startsWith(r)) && role === 'central_admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/stock/:path*',
    '/billing/:path*',
    '/bills/:path*',
    '/dealers/:path*',
    '/analytics/:path*',
    '/ai/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};
