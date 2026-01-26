import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Sign Out Route
 *
 * Why is this a Route Handler instead of a client-side call?
 *
 * You *could* call supabase.auth.signOut() from the client, but:
 * 1. It's cleaner to have a dedicated endpoint
 * 2. The server can clear cookies more reliably
 * 3. You can add logging/analytics here later
 *
 * Usage: <a href="/signout">Sign out</a>
 * Or: fetch('/signout', { method: 'POST' })
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/signin`, {
    // 302 redirect (temporary) is appropriate for logout
    status: 302,
  });
}

// Also support GET for simple <a href="/auth/signout"> links
export async function GET(request: Request) {
  return POST(request);
}
