'use server';

/**
 * Server Actions for Job Management
 *
 * Server Actions are functions that run on the server but can be called
 * from Client Components. They're perfect for:
 * - Database mutations (create, update, delete)
 * - Operations that need server-side secrets
 * - Anything that shouldn't expose logic to the client
 *
 * Key pattern: We return a consistent shape { success, error, data }
 * so the UI can handle all cases predictably.
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export type AddJobFormState = {
  success: boolean;
  error?: string;
  data?: {
    id: number;
    title: string;
  };
} | null;

export type UpdateJobFormState = {
  success: boolean;
  error?: string;
  data?: {
    id: number;
    title: string;
  };
} | null;

// ─────────────────────────────────────────────────────────────────
// ADD JOB (existing)
// ─────────────────────────────────────────────────────────────────

export async function addJob(
  _prevState: AddJobFormState,
  formData: FormData,
): Promise<AddJobFormState> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'You must be logged in to add a job' };
  }

  // Extract form data
  const title = formData.get('title') as string;
  const company = formData.get('company') as string;
  const location = formData.get('location') as string;
  const url = formData.get('url') as string;

  // Validate
  if (!title || !company || !location || !url) {
    return { success: false, error: 'All fields are required' };
  }

  // Insert job
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      title,
      company,
      location,
      url,
      created_by: user.id,
      is_active: true,
    })
    .select('id, title')
    .single();

  if (error) {
    console.error('Error adding job:', error);
    return { success: false, error: error.message };
  }

  // Revalidate the jobs pages so they show the new job
  revalidatePath('/');
  revalidatePath('/admin/jobs');

  return { success: true, data };
}

// ─────────────────────────────────────────────────────────────────
// UPDATE JOB (new)
// ─────────────────────────────────────────────────────────────────

/**
 * Update an existing job
 *
 * Security considerations:
 * 1. User must be authenticated
 * 2. User must have admin/owner role (checked via RLS or here)
 * 3. We track who modified the job (modified_by field)
 *
 * The formData includes the job ID as a hidden field.
 */
export async function updateJob(
  _prevState: UpdateJobFormState,
  formData: FormData,
): Promise<UpdateJobFormState> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'You must be logged in to update a job' };
  }

  // Check user role (defense in depth - RLS should also enforce this)
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'owner'].includes(profile.user_role)) {
    return { success: false, error: 'You do not have permission to edit jobs' };
  }

  // Extract form data
  const id = parseInt(formData.get('id') as string, 10);
  const title = formData.get('title') as string;
  const company = formData.get('company') as string;
  const location = formData.get('location') as string;
  const url = formData.get('url') as string;
  const isActive = formData.get('is_active') === 'true';

  // Validate
  if (!id || isNaN(id)) {
    return { success: false, error: 'Invalid job ID' };
  }

  if (!title || !company || !location || !url) {
    return { success: false, error: 'All fields are required' };
  }

  // Update job
  const { data, error } = await supabase
    .from('jobs')
    .update({
      title,
      company,
      location,
      url,
      is_active: isActive,
      modified_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, title')
    .single();

  if (error) {
    console.error('Error updating job:', error);
    return { success: false, error: error.message };
  }

  // Revalidate pages that show jobs
  revalidatePath('/');
  revalidatePath('/admin/jobs');

  return { success: true, data };
}
