'use client';

/**
 * EditJobSheet Component
 *
 * Similar to AddJobSheet but for editing existing jobs.
 *
 * KEY PATTERN FIX:
 * ────────────────────────────────────────────────────────────────
 * Instead of using useEffect to sync props → state, we:
 * 1. Split into a "shell" (EditJobSheet) that handles open/close
 * 2. And a "form" (EditJobForm) that receives the job
 * 3. Use `key={job.id}` so React remounts the form when job changes
 *
 * This is React's recommended pattern because:
 * - No useEffect needed for prop → state sync
 * - Component remounts = fresh state automatically
 * - Simpler mental model
 *
 * See: https://react.dev/learn/you-might-not-need-an-effect#resetting-all-state-when-a-prop-changes
 */

import { useState, useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { updateJob, type UpdateJobFormState } from '@/lib/actions/jobs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangleIcon, CheckCircle2 } from 'lucide-react';
import { type Job } from './columns';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const PRESET_LOCATIONS = ['Lisbon', 'Porto', 'Remote'];

const TRACKING_PARAM_PATTERNS = [
  /^utm_/,
  /^ref$/,
  /^fbclid$/,
  /^gclid$/,
  /^gad_source$/,
  /^msclkid$/,
  /^twclid$/,
  /^li_fat_id$/,
  /^mc_eid$/,
  /^oly_enc_id$/,
  /^_hsenc$/,
  /^_hsmi$/,
  /^vero_id$/,
  /^mkt_tok$/,
];

const isTrackingParam = (key: string) =>
  TRACKING_PARAM_PATTERNS.some((pattern) => pattern.test(key));

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface EditJobSheetProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditJobFormProps {
  job: Job;
  onSuccess: () => void;
}

// ─────────────────────────────────────────────────────────────────
// HELPER: URL CLEANING
// ─────────────────────────────────────────────────────────────────

function cleanTrackingParams(inputUrl: string): string {
  try {
    const parsed = new URL(inputUrl);
    const paramsToDelete: string[] = [];

    parsed.searchParams.forEach((_, key) => {
      if (isTrackingParam(key)) {
        paramsToDelete.push(key);
      }
    });

    paramsToDelete.forEach((key) => parsed.searchParams.delete(key));

    return parsed.toString();
  } catch {
    return inputUrl;
  }
}

// ─────────────────────────────────────────────────────────────────
// EDIT JOB FORM (Inner Component)
// ─────────────────────────────────────────────────────────────────

/**
 * This component initializes state from props in useState.
 * Because the parent uses `key={job.id}`, this component
 * remounts when the job changes → fresh state each time.
 *
 * NO useEffect needed for syncing!
 */
function EditJobForm({ job, onSuccess }: EditJobFormProps) {
  // Initialize state directly from props (works because we remount on job change)
  const [title, setTitle] = useState(job.title);
  const [company, setCompany] = useState(job.company);
  const [location, setLocation] = useState(job.location);
  const [url, setUrl] = useState(job.url);
  const [isActive, setIsActive] = useState(job.is_active);

  const [state, formAction, isPending] = useActionState(updateJob, null);

  // Close sheet on successful update
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        onSuccess();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state?.success, onSuccess]);

  const handleUrlChange = (inputUrl: string) => {
    const cleaned = cleanTrackingParams(inputUrl);
    setUrl(cleaned);
  };

  const hasRemainingParams = (() => {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.size > 0;
    } catch {
      return false;
    }
  })();

  const removeAllParams = () => {
    try {
      const parsed = new URL(url);
      parsed.search = '';
      setUrl(parsed.toString());
    } catch {
      // Invalid URL, do nothing
    }
  };

  return (
    <>
      <div className='py-2'>
        {/* Success Message */}
        {state?.success && (
          <div className='mx-4 mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start gap-3'>
            <CheckCircle2 className='h-5 w-5 mt-0.5 flex-shrink-0' />
            <div>
              <p className='font-medium'>Job updated successfully!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {state?.error && (
          <div className='mx-4 mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
            <p className='font-medium'>Error updating job</p>
            <p className='text-sm mt-1'>{state.error}</p>
          </div>
        )}

        {/* Form */}
        <form action={formAction} id='edit-job-form' className='space-y-5 px-4'>
          {/* Hidden field for job ID */}
          <input type='hidden' name='id' value={job.id} />

          {/* Hidden field for is_active */}
          <input type='hidden' name='is_active' value={String(isActive)} />

          {/* Status Toggle */}
          <div className='space-y-2'>
            <label className='block text-xs font-medium text-foreground'>
              Status
            </label>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                role='switch'
                aria-checked={isActive}
                onClick={() => setIsActive(!isActive)}
                disabled={isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className='text-sm text-gray-600 dark:text-[#ffffff]/50'>
                {isActive
                  ? 'Active — visible on the job board'
                  : 'Inactive — hidden from the job board'}
              </span>
            </div>
          </div>

          {/* URL */}
          <div className='space-y-2'>
            <label
              htmlFor='edit-url'
              className='block text-xs font-medium text-foreground'
            >
              Job URL
            </label>
            <input
              type='url'
              id='edit-url'
              name='url'
              required
              disabled={isPending}
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder='https://company.com/careers/job-id'
              className='w-full h-10 px-3 py-2 bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground'
            />
            {hasRemainingParams ? (
              <p className='text-xs text-[#e4683a]'>
                This URL has query parameters.{' '}
                <button
                  type='button'
                  onClick={removeAllParams}
                  className='underline hover:text-amber-700'
                >
                  Remove them
                </button>{' '}
                unless the site needs them to show the job.
              </p>
            ) : (
              <p className='text-xs text-gray-500 dark:text-[#ffffff]/50'>
                Direct link to the job posting
              </p>
            )}
          </div>

          {/* Title */}
          <div className='space-y-2'>
            <label
              htmlFor='edit-title'
              className='block text-xs font-medium text-foreground'
            >
              Job Title
            </label>
            <input
              type='text'
              id='edit-title'
              name='title'
              required
              disabled={isPending}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Senior Product Designer'
              className='w-full h-10 px-3 py-2 bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground'
            />
          </div>

          {/* Company */}
          <div className='space-y-2'>
            <label
              htmlFor='edit-company'
              className='block text-xs font-medium text-foreground'
            >
              Company
            </label>
            <input
              type='text'
              id='edit-company'
              name='company'
              required
              disabled={isPending}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder='Upframe'
              className='w-full h-10 px-3 py-2 bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground'
            />
          </div>

          {/* Location */}
          <div className='space-y-2'>
            <label
              htmlFor='edit-location'
              className='block text-xs font-medium text-foreground'
            >
              Location
            </label>
            <input
              type='text'
              id='edit-location'
              name='location'
              required
              disabled={isPending}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='Lisbon'
              className='w-full h-10 px-3 py-2 bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground'
            />
            <div className='flex gap-2 mt-2'>
              {PRESET_LOCATIONS.map((preset) => (
                <Button
                  key={preset}
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={isPending}
                  onClick={() => setLocation(preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>
        </form>

        {/* Info Alert */}
        <section className='flex p-4 mt-6'>
          <Alert className='w-full border-blue-200 dark:border-border bg-blue-50 text-blue-900 dark:text-foreground dark:bg-background'>
            <AlertTriangleIcon className='h-4 w-4' />
            <AlertTitle>Changes are immediate</AlertTitle>
            <AlertDescription className='dark:text-[#ffffff]/50'>
              Updates will be reflected on the job board right away.
              Deactivating a job will hide it from public view.
            </AlertDescription>
          </Alert>
        </section>
      </div>

      {/* Footer */}
      <SheetFooter className='border-t flex flex-row justify-end gap-3 pt-4'>
        <Button type='submit' form='edit-job-form' disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </SheetFooter>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// EDIT JOB SHEET (Outer Shell)
// ─────────────────────────────────────────────────────────────────

/**
 * The "shell" component handles:
 * - Open/close state
 * - Rendering the Sheet UI
 * - Passing the job to the form with a key
 *
 * The KEY PROP is crucial:
 * `key={job.id}` tells React "this is a different form instance"
 * React will unmount the old form and mount a new one.
 */
export function EditJobSheet({ job, open, onOpenChange }: EditJobSheetProps) {
  // Don't render anything if no job is selected
  if (!job) return null;

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-lg overflow-y-auto p-0'>
        <SheetHeader className='border-b'>
          <SheetTitle>Edit Job</SheetTitle>
          <SheetDescription>
            Update this job listing. Changes will be reflected immediately.
          </SheetDescription>
        </SheetHeader>

        {/* KEY PROP: Forces remount when job changes */}
        <EditJobForm key={job.id} job={job} onSuccess={handleSuccess} />
      </SheetContent>
    </Sheet>
  );
}
