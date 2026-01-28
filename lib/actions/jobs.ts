'use server';

/**
 * Server Action: Add Job
 *
 * This is a shared action that can be imported by any page/component.
 * The 'use server' directive at the top makes ALL exports in this file Server Actions.
 *
 * Used by:
 * - /admin (Sheet form)
 * - /admin/jobs/new (standalone page)
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { captureServerEvent } from '@/lib/posthog/server';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

type Profile = {
  user_role: 'owner' | 'admin' | 'user';
  full_name: string | null;
  email: string;
};

export type AddJobFormState = {
  success: boolean;
  error?: string;
} | null;

// ─────────────────────────────────────────────────────────────────
// ACTION
// ─────────────────────────────────────────────────────────────────

export async function addJob(
  prevState: AddJobFormState,
  formData: FormData,
): Promise<AddJobFormState> {
  const supabase = await createClient();

  // ─────────────────────────────────────────────────────────────
  // 1. AUTHENTICATION & AUTHORIZATION
  // ─────────────────────────────────────────────────────────────

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role, email, full_name')
    .eq('id', user.id)
    .single<Profile>();

  if (
    !profile ||
    (profile.user_role !== 'admin' && profile.user_role !== 'owner')
  ) {
    return { success: false, error: 'Not authorized' };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. VALIDATE INPUT
  // ─────────────────────────────────────────────────────────────

  const title = formData.get('title') as string;
  const company = formData.get('company') as string;
  const location = formData.get('location') as string;
  const url = formData.get('url') as string;

  if (!title || !company || !location || !url) {
    return { success: false, error: 'All fields are required' };
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return { success: false, error: 'Please enter a valid URL' };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. INSERT JOB
  // ─────────────────────────────────────────────────────────────

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
    return { success: false, error: 'Failed to add job. Please try again.' };
  }

  // ─────────────────────────────────────────────────────────────
  // 4. AWARD POINTS
  // ─────────────────────────────────────────────────────────────

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
    // Don't fail the request - job was added successfully
  }

  // ─────────────────────────────────────────────────────────────
  // 5. ANALYTICS
  // ─────────────────────────────────────────────────────────────

  captureServerEvent(user.id, 'job_added', {
    job_id: newJob.id,
    job_title: title,
    company,
    location,
    short_code: newJob.short_code,
    points_awarded: 100,
    new_points_total: newPoints,
    user_email: profile.email,
    user_name: profile.full_name,
    user_role: profile.user_role,
  });

  // ─────────────────────────────────────────────────────────────
  // 6. REVALIDATE CACHES
  // ─────────────────────────────────────────────────────────────

  revalidatePath('/');
  revalidatePath('/admin');

  return { success: true };
}
