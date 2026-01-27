import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { captureServerEvent } from '@/lib/posthog/server';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

/**
 * Add Job Page
 *
 * - Protected: Only admin and owner roles can access
 * - Server Component with embedded Server Action
 * - Awards 100 points on successful job creation
 * - Tracks job_added event in PostHog (server-side)
 */

// Types
type Profile = {
  id: string;
  user_role: 'owner' | 'admin' | 'user';
  full_name: string | null;
  email: string;
};

// Server Action for form submission
async function addJob(formData: FormData) {
  'use server';

  const supabase = await createClient();

  // Verify user is still authenticated and authorized
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role, email, full_name')
    .eq('id', user.id)
    .single<Pick<Profile, 'user_role' | 'email' | 'full_name'>>();

  if (
    !profile ||
    (profile.user_role !== 'admin' && profile.user_role !== 'owner')
  ) {
    throw new Error('Not authorized');
  }

  // Extract form data
  const title = formData.get('title') as string;
  const company = formData.get('company') as string;
  const location = formData.get('location') as string;
  const url = formData.get('url') as string;

  // Validate required fields
  if (!title || !company || !location || !url) {
    throw new Error('All fields are required');
  }

  // Insert the job and get back the new job's ID and short_code
  const { data: newJob, error: jobError } = await supabase
    .from('jobs')
    .insert({
      title,
      company,
      location,
      url,
      is_active: true,
      submitted_on: new Date().toISOString(),
    })
    .select('id, short_code')
    .single();

  if (jobError) {
    console.error('Error inserting job:', jobError);
    throw new Error('Failed to add job');
  }

  // Award points using admin client (service_role)
  const adminClient = createAdminClient();
  const { data: newPoints, error: pointsError } = await adminClient.rpc(
    'add_points',
    {
      target_user_id: user.id,
      points_to_add: 100,
    },
  );

  if (pointsError) {
    console.error('Error adding points:', pointsError);
    // Don't throw - job was added successfully, points are secondary
  }

  // Track event in PostHog (server-side)
  captureServerEvent(user.id, 'job_added', {
    job_id: newJob?.id,
    job_title: title,
    company,
    location,
    short_code: newJob?.short_code,
    points_awarded: 100,
    new_points_total: newPoints,
    user_email: profile.email,
    user_name: profile.full_name,
    user_role: profile.user_role,
  });

  // Revalidate the home page to show the new job
  revalidatePath('/');
  revalidatePath('/admin');

  // Redirect back to form with success message
  redirect('/admin/jobs/new?success=true');
}

export default async function AddJobPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const supabase = await createClient();
  const { success } = await searchParams;

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/signin');
  }

  // Check authorization
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, user_role, full_name, email')
    .eq('id', user.id)
    .single<Profile>();

  if (
    !profile ||
    (profile.user_role !== 'admin' && profile.user_role !== 'owner')
  ) {
    redirect('/admin?error=unauthorized');
  }

  return (
    <main className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm'>
        <div className='max-w-2xl mx-auto px-4 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Link href='/admin' className='text-gray-500 hover:text-gray-700'>
              ← Back
            </Link>
            <h1 className='font-semibold'>Add Job</h1>
          </div>
          <span className='text-sm text-gray-500'>+100 points</span>
        </div>
      </header>

      <div className='max-w-2xl mx-auto px-4 py-8'>
        {/* Success Message */}
        {success && (
          <div className='mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md'>
            <p className='font-medium'>Job added successfully!</p>
            <p className='text-sm mt-1'>You earned 100 points.</p>
          </div>
        )}

        {/* Form */}
        <form action={addJob} className='space-y-6'>
          <div className='bg-white shadow-sm rounded-lg p-6 space-y-5'>
            {/* Title */}
            <div className='space-y-2'>
              <label
                htmlFor='title'
                className='block text-sm font-medium text-gray-700'
              >
                Job Title
              </label>
              <input
                type='text'
                id='title'
                name='title'
                required
                placeholder='Senior Product Designer'
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>

            {/* Company */}
            <div className='space-y-2'>
              <label
                htmlFor='company'
                className='block text-sm font-medium text-gray-700'
              >
                Company
              </label>
              <input
                type='text'
                id='company'
                name='company'
                required
                placeholder='Acme Inc.'
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>

            {/* Location */}
            <div className='space-y-2'>
              <label
                htmlFor='location'
                className='block text-sm font-medium text-gray-700'
              >
                Location
              </label>
              <input
                type='text'
                id='location'
                name='location'
                required
                placeholder='Lisbon, Portugal (Hybrid)'
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
              <p className='text-xs text-gray-500'>
                Include remote/hybrid/on-site if known
              </p>
            </div>

            {/* URL */}
            <div className='space-y-2'>
              <label
                htmlFor='url'
                className='block text-sm font-medium text-gray-700'
              >
                Job URL
              </label>
              <input
                type='url'
                id='url'
                name='url'
                required
                placeholder='https://company.com/careers/job-id'
                className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
              <p className='text-xs text-gray-500'>
                Direct link to the job posting
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className='flex justify-end gap-3'>
            <Link
              href='/admin'
              className='px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900'
            >
              Cancel
            </Link>
            <button
              type='submit'
              className='px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            >
              Add Job
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
