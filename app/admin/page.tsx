import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

/**
 * Admin Page (Protected + Role-Based)
 *
 * This is a Server Component, which means:
 * - It runs on the server, not in the browser
 * - It can directly query the database
 * - It can access the session from cookies
 * - The user never sees loading states (page renders complete)
 *
 * Protection Flow:
 * 1. Get user from session (via cookies)
 * 2. If no user → redirect to login
 * 3. Fetch their profile (including role)
 * 4. Render UI based on role
 */

// TypeScript type for our profile
type Profile = {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  user_role: 'owner' | 'admin' | 'user';
  points: number;
};

export default async function AdminPage() {
  const supabase = await createClient();

  // Step 1: Check if user is logged in
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    // Not logged in → redirect to login
    redirect('/signin');
  }

  // Step 2: Fetch their profile (includes role and points)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  if (profileError || !profile) {
    // Profile not found (shouldn't happen if trigger works)
    // Could redirect to an onboarding page or show error
    return (
      <main className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-xl font-semibold text-red-600'>
            Profile not found
          </h1>
          <p className='text-gray-600 mt-2'>Please contact support.</p>
        </div>
      </main>
    );
  }

  // Step 3: Check authorization (optional - you might want all logged-in users here)
  // For now, let's allow all authenticated users but show different UI
  const isAdmin =
    profile.user_role === 'admin' || profile.user_role === 'owner';
  const isOwner = profile.user_role === 'owner';

  return (
    <main className='min-h-screen bg-[#FFF6F1]'>
      {/* Header */}
      <header className='bg-white shadow-sm'>
        <div className='max-w-5xl mx-auto px-4 py-4 flex items-center justify-between'>
          <Link href='/' className='font-semibold text-lg'>
            LisboaUX Jobs
          </Link>
          <div className='flex items-center gap-4'>
            <span className='text-sm text-gray-600'>
              {profile.full_name || profile.email}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                profile.user_role === 'owner'
                  ? 'bg-purple-100 text-purple-700'
                  : profile.user_role === 'admin'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {profile.user_role}
            </span>
            <a
              href='/signout'
              className='text-sm text-gray-500 hover:text-gray-700'
            >
              Sign out
            </a>
          </div>
        </div>
      </header>

      <div className='max-w-5xl mx-auto px-4 py-8'>
        {/* Welcome Section */}
        <div className='mb-8'>
          <h1 className='text-2xl font-semibold'>
            Welcome back, {profile.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className='text-gray-600 mt-1'>
            You have <strong>{profile.points}</strong> points.
          </p>
        </div>

        {/* Role-Based UI: Admin/Owner Only */}
        {isAdmin && (
          <section className='mb-8'>
            <h2 className='text-lg font-medium mb-4 flex items-center gap-2'>
              <span>🔧</span> Admin Tools
            </h2>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <AdminCard
                title='Add Job'
                description='Post a new job listing to the board'
                href='/admin/jobs/new'
              />
              <AdminCard
                title='Manage Jobs'
                description='Edit or deactivate existing listings'
                href='/admin/jobs'
              />
              <AdminCard
                title='Leaderboard'
                description='See contributor rankings'
                href='/admin/leaderboard'
              />
            </div>
          </section>
        )}

        {/* Role-Based UI: Owner Only */}
        {isOwner && (
          <section className='mb-8'>
            <h2 className='text-lg font-medium mb-4 flex items-center gap-2'>
              <span>👑</span> Owner Tools
            </h2>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <AdminCard
                title='Manage Users'
                description='View and manage user roles'
                href='/admin/users'
                variant='purple'
              />
              <AdminCard
                title='Analytics'
                description='View site metrics and PostHog data'
                href='/admin/analytics'
                variant='purple'
              />
            </div>
          </section>
        )}

        {/* All Users Section */}
        <section>
          <h2 className='text-lg font-medium mb-4 flex items-center gap-2'>
            <span>⭐</span> Your Activity
          </h2>
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <p className='text-gray-500 text-sm'>
              {isAdmin
                ? 'Your recent job submissions and points history will appear here.'
                : 'Your saved jobs and activity will appear here.'}
            </p>
            {/* TODO: Add actual activity feed */}
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * Reusable card component for admin actions
 */
function AdminCard({
  title,
  description,
  href,
  variant = 'blue',
}: {
  title: string;
  description: string;
  href: string;
  variant?: 'blue' | 'purple';
}) {
  const colors = {
    blue: 'hover:border-blue-300 hover:bg-blue-50',
    purple: 'hover:border-purple-300 hover:bg-purple-50',
  };

  return (
    <Link
      href={href}
      className={`block p-4 bg-white rounded-lg shadow-sm border border-gray-200 transition-colors ${colors[variant]}`}
    >
      <h3 className='font-medium'>{title}</h3>
      <p className='text-sm text-gray-600 mt-1'>{description}</p>
    </Link>
  );
}
