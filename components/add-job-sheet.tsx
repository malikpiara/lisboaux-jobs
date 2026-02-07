'use client';

/**
 * AddJobSheet Component
 *
 * Combines the Sheet UI with the JobForm.
 * Controls the sheet's open/close state so we can:
 * - Close the sheet when form submits successfully
 * - Reset form state when sheet is reopened
 *
 * This is a Client Component because:
 * - Sheet needs client-side state for open/close
 * - We need to coordinate between Sheet state and form submission
 */

import { useState, useActionState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { addJob } from '@/lib/actions/jobs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangleIcon } from 'lucide-react';
import { showPointsToast } from './leaderboard-toast';
import { PRESET_LOCATIONS } from '@/lib/constants';
import {
  cleanTrackingParams,
  hasQueryParams,
  removeAllQueryParams,
} from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

export function AddJobSheet() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [state, formAction, isPending] = useActionState(addJob, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Close sheet and reset form on successful submission
  useEffect(() => {
    if (state?.success) {
      showPointsToast({ points: 100, message: 'Added a New Job! Hurray 🙌' });
      // Small delay so user sees the success state briefly
      const timer = setTimeout(() => {
        setOpen(false);
        // Reset form fields
        formRef.current?.reset();
        setLocation('');
        setUrl('');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleUrlChange = (inputUrl: string) => {
    setUrl(cleanTrackingParams(inputUrl));
  };

  const hasRemainingParams = hasQueryParams(url);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className='cursor-pointer block p-4 bg-card rounded-lg shadow-sm border hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-white/16 active:scale-[0.97] transition-[background-color,transform]'>
          <h3 className='font-medium'>Add Job</h3>
          <p className='text-sm text-gray-600 dark:text-[#ffffffc9] mt-1'>
            Post a new job listing to the board
          </p>
        </div>
      </SheetTrigger>
      <SheetContent className='sm:max-w-lg flex flex-col p-0'>
        <SheetHeader className='border-b'>
          <SheetTitle>Add a New Job</SheetTitle>
          <SheetDescription>
            Add a new job listing. You&apos;ll earn 100 points.
          </SheetDescription>
        </SheetHeader>

        <div className='flex flex-col flex-1 min-h-0'>
          <div className='py-2 flex-1 overflow-y-auto'>
            {/* Error Message */}
            {state?.error && (
              <div className='mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
                <p className='font-medium'>Error adding job</p>
                <p className='text-sm mt-1'>{state.error}</p>
              </div>
            )}

            <form
              ref={formRef}
              action={formAction}
              id='add-job-form'
              className='space-y-5 px-4'
            >
              {/* URL */}
              <div className='space-y-2'>
                <label
                  htmlFor='sheet-url'
                  className='block text-xs font-medium text-foreground'
                >
                  Job URL
                </label>
                <input
                  type='url'
                  id='sheet-url'
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
                      onClick={() => setUrl(removeAllQueryParams(url))}
                      className='underline hover:text-amber-700'
                    >
                      Remove them
                    </button>{' '}
                    unless the site needs them to show the job.
                  </p>
                ) : (
                  <p className='text-xs text-gray-500'>
                    Direct link to the job posting
                  </p>
                )}
              </div>

              {/* Title */}
              <div className='space-y-2'>
                <label
                  htmlFor='sheet-title'
                  className='block text-xs font-medium text-foreground'
                >
                  Job Title
                </label>
                <input
                  type='text'
                  id='sheet-title'
                  name='title'
                  required
                  disabled={isPending}
                  placeholder='Senior Product Designer'
                  className='w-full h-10 px-3 py-2 bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground'
                />
              </div>

              {/* Company */}
              <div className='space-y-2'>
                <label
                  htmlFor='sheet-company'
                  className='block text-xs font-medium text-foreground'
                >
                  Company
                </label>
                <input
                  type='text'
                  id='sheet-company'
                  name='company'
                  required
                  disabled={isPending}
                  placeholder='Upframe'
                  className='w-full h-10 px-3 py-2 bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted disabled:text-muted-foreground'
                />
              </div>

              {/* Location */}
              <div className='space-y-2'>
                <label
                  htmlFor='sheet-location'
                  className='block text-xs font-medium text-foreground'
                >
                  Location
                </label>
                <input
                  type='text'
                  id='sheet-location'
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
                {/* Warning Message */}
              </div>
            </form>
            <section className='flex p-4 mt-6'>
              <AlertColors />
            </section>
          </div>
        </div>
        {/* Footer - outside the scrollable area */}
        <SheetFooter className='border-t flex flex-row justify-end gap-3 px-4 py-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type='submit' form='add-job-form' disabled={isPending}>
            {isPending ? 'Publishing...' : 'Publish Job'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function AlertColors() {
  return (
    <Alert className='w-full border-[#FFE4D6] bg-[#fff4ef] text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50'>
      <AlertTriangleIcon />
      <AlertTitle>
        Heads up! This job will be posted to Slack and Telegram
      </AlertTitle>
      <AlertDescription>
        Once submitted, this job will be automatically shared with our
        subscribers. Please double check hitting publish.
      </AlertDescription>
    </Alert>
  );
}
