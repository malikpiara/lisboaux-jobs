import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Updates the Supabase session by refreshing expired tokens.
 *
 * This runs on EVERY request (via middleware.ts at project root).
 *
 * Why is this needed?
 * - JWTs have an expiration time (default: 1 hour in Supabase)
 * - When expired, the user appears logged out
 * - This middleware silently refreshes the token before it expires
 * - It also syncs the new token to cookies
 *
 * Without this, users would be randomly logged out after 1 hour.
 */
export async function updateSession(request: NextRequest) {
  // Start with the incoming request, prepare to potentially modify response
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update cookies on the request (for downstream handlers)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Update cookies on the response (for the browser)
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Do not remove this line!
  // Calling getUser() triggers the token refresh if needed.
  // Even if you don't use the user here, the refresh still happens.
  await supabase.auth.getUser();

  return supabaseResponse;
}
