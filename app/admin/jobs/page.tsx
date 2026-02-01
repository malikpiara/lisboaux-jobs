import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { JobsTableWithSheet } from './jobs-table-with-sheet';
import { type Job } from './columns';

/**
 * Admin Jobs Page
 *
 * This is a SERVER COMPONENT, which means:
 * - Runs on the server at request time
 * - Can directly query the database
 * - Can access cookies/sessions
 * - Renders complete HTML (no loading states)
 *
 * DATA FLOW:
 * ┌──────────────────────────────────────────────────────────┐
 * │  1. Check auth (server-side)                             │
 * │  2. Fetch jobs from Supabase                             │
 * │  3. Pass jobs to Client Component                        │
 * │  4. Client handles interactivity (clicks, edits)         │
 * └──────────────────────────────────────────────────────────┘
 *
 * WHY SERVER COMPONENT FOR DATA FETCHING?
 * - No client-side loading states needed
 * - Data is ready when the page renders
 * - Sensitive data (like Supabase client) stays server-side
 * - Better SEO (though this admin page doesn't need it)
 */

export default async function AdminJobsPage() {
  const supabase = await createClient();

  // ─────────────────────────────────────────────────────────────
  // AUTHENTICATION CHECK
  // ─────────────────────────────────────────────────────────────

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/signin');
  }

  // ─────────────────────────────────────────────────────────────
  // AUTHORIZATION CHECK
  // ─────────────────────────────────────────────────────────────

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'owner'].includes(profile.user_role)) {
    // Not authorized - redirect to regular admin page
    redirect('/admin');
  }

  // ─────────────────────────────────────────────────────────────
  // FETCH JOBS
  // ─────────────────────────────────────────────────────────────

  /**
   * We fetch ALL jobs here (no pagination at DB level).
   * This is fine for < 500 jobs. For larger datasets,
   * you'd want server-side pagination.
   *
   * The select() specifies exactly which columns we need.
   * This is a security best practice (don't expose more than needed)
   * and a performance optimization (less data transferred).
   */
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select(
      `
      id,
      title,
      company,
      location,
      url,
      submitted_on,
      is_active,
      short_code,
      created_by,
      modified_by,
      updated_at
    `,
    )
    .order('submitted_on', { ascending: false });

  if (jobsError) {
    console.error('Error fetching jobs:', jobsError);
    return (
      <main className='min-h-screen bg-background'>
        <div className='max-w-6xl mx-auto px-4 py-8'>
          <div className='text-red-600'>
            Failed to load jobs. Please try again later.
          </div>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <main className='min-h-screen bg-background'>
      <nav className='text-sm text-gray-500 mb-2'>
        <Link href='/admin' className='hover:text-gray-700'>
          Admin
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-900'>Jobs</span>
      </nav>
      <div className='max-w-6xl mx-auto px-4 py-8 bg-card border rounded-2xl'>
        {/* Header with navigation */}
        <div className='flex items-center justify-between mb-6 '>
          <div>
            <h1 className='text-2xl font-semibold'>Manage Jobs</h1>
            <p className='text-gray-600 dark:text-[#ffffff]/50 mt-1'>
              View and edit all job listings. Click on a job title to edit.
            </p>
          </div>

          {/* Stats */}
          <div className='text-right'>
            <p className='text-2xl font-semibold text-gray-900 dark:text-card-foreground'>
              {jobs?.length ?? 0}
            </p>
            <p className='text-sm text-gray-500 dark:text-[#ffffff]/50'>
              Total jobs
            </p>
          </div>
        </div>

        {/* Table + Sheet */}
        <JobsTableWithSheet initialJobs={(jobs as Job[]) ?? []} />
      </div>
    </main>
  );
}
