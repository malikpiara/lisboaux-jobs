import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js Middleware
 *
 * This runs BEFORE every request that matches the `matcher` config.
 *
 * What it does:
 * 1. Refreshes the Supabase session (if token is expiring)
 * 2. Updates cookies with the new token
 *
 * Later, you can add:
 * - Route protection (redirect unauthenticated users from /admin)
 * - Role-based access control
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Matcher config: which routes should this middleware run on?
 *
 * This pattern excludes:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico, sitemap.xml, robots.txt
 * - Public images (svg, png, jpg, etc.)
 *
 * Everything else (pages, API routes) will go through the middleware.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
