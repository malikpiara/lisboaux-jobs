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

import { useState, useActionState, useEffect } from 'react';
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
import { addJob, type AddJobFormState } from '@/lib/actions/jobs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangleIcon } from 'lucide-react';
import { showPointsToast } from './leaderboard-toast';

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
// COMPONENT
// ─────────────────────────────────────────────────────────────────

export function AddJobSheet() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [state, formAction, isPending] = useActionState(addJob, null);

  // Close sheet and reset form on successful submission
  useEffect(() => {
    if (state?.success) {
      showPointsToast({ points: 100, message: 'Added a New Job! Hurray 🙌' });
      // Small delay so user sees the success state briefly
      const timer = setTimeout(() => {
        setOpen(false);
        // Reset form fields
        setLocation('');
        setUrl('');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state?.success]);

  // Clean tracking params from URL
  const cleanTrackingParams = (inputUrl: string): string => {
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
  };

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className='cursor-pointer block p-4 bg-card rounded-lg shadow-sm border transition-colors hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-white/16'>
          <h3 className='font-medium'>Add Job</h3>
          <p className='text-sm text-gray-600 dark:text-[#ffffffc9] mt-1'>
            Post a new job listing to the board
          </p>
        </div>
      </SheetTrigger>
      <SheetContent className='sm:max-w-lg overflow-y-auto p-0'>
        <SheetHeader className='border-b'>
          <SheetTitle>Add a New Job</SheetTitle>
          <SheetDescription>
            Add a new job listing. You&apos;ll earn 100 points.
          </SheetDescription>
        </SheetHeader>

        <div className='py-2'>
          {/* Success Message: TODO replace with something else */}
          {/* {state?.success && (
            <div className='mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md'>
              <p className='font-medium'>Job added successfully!</p>
              <p className='text-sm mt-1'>You earned 100 points.</p>
            </div>
          )} */}

          {/* Error Message */}
          {state?.error && (
            <div className='mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
              <p className='font-medium'>Error adding job</p>
              <p className='text-sm mt-1'>{state.error}</p>
            </div>
          )}

          {/* Form */}
          <form
            action={formAction}
            id='add-job-form'
            className='space-y-5 px-4 '
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
                    onClick={removeAllParams}
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
        {/* Footer - outside the scrollable area */}
        <SheetFooter className='border-t flex flex-row justify-end gap-3 pt-4'>
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
