import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth Callback Route
 *
 * This route handles:
 * 1. Email confirmation links (click link in email → land here)
 * 2. OAuth redirects (Google, GitHub, etc. → redirect here)
 * 3. Magic link authentication
 *
 * How it works:
 * - Supabase appends a `code` query parameter to the callback URL
 * - We exchange this code for a session
 * - Then redirect the user to their intended destination
 *
 * Configure this URL in Supabase Dashboard:
 * Authentication > URL Configuration > Redirect URLs
 * Add: http://localhost:3000/auth/callback (for dev)
 * Add: https://jobs.lisboaux.com/auth/callback (for prod)
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Where to redirect after auth (default: /admin)
  const next = searchParams.get('next') ?? '/admin';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful auth! Redirect to the intended page.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If we get here, something went wrong
  // Redirect to an error page (you can create this later)
  return NextResponse.redirect(`${origin}/signin?error=auth_callback_error`);
}
