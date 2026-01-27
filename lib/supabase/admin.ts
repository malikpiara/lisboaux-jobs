import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with service_role privileges.
 *
 * USE WITH CAUTION! This client:
 * - Bypasses Row Level Security (RLS)
 * - Can call admin-only functions (add_points, set_user_role)
 * - Should NEVER be exposed to the browser
 *
 * The service_role key is NOT prefixed with NEXT_PUBLIC_
 * so it's only available on the server.
 *
 * Usage:
 *   // In a Server Action or Route Handler
 *   import { createAdminClient } from '@/lib/supabase/admin'
 *   const supabase = createAdminClient()
 *   await supabase.rpc('add_points', { target_user_id: userId, points_to_add: 100 })
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to your .env.local file.\n' +
        'Find it in Supabase Dashboard > Settings > API > service_role key',
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Don't persist sessions for admin client
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
