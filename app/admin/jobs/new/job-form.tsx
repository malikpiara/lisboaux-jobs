'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const PRESET_LOCATIONS = ['Lisbon', 'Porto', 'Remote'];

// Tracking params that are always safe to remove
// These never affect page content, only analytics
const TRACKING_PARAM_PATTERNS = [
  /^utm_/, // Google Analytics: utm_source, utm_medium, utm_campaign, etc.
  /^ref$/, // Generic referral
  /^fbclid$/, // Facebook
  /^gclid$/, // Google Ads
  /^gad_source$/, // Google Ads
  /^msclkid$/, // Microsoft/Bing Ads
  /^twclid$/, // Twitter/X
  /^li_fat_id$/, // LinkedIn
  /^mc_eid$/, // Mailchimp
  /^oly_enc_id$/, // Omeda
  /^_hsenc$/, // HubSpot
  /^_hsmi$/, // HubSpot
  /^vero_id$/, // Vero
  /^mkt_tok$/, // Marketo
];

const isTrackingParam = (key: string) =>
  TRACKING_PARAM_PATTERNS.some((pattern) => pattern.test(key));

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

type JobFormProps = {
  addJob: (prevState: FormState, formData: FormData) => Promise<FormState>;
};

type FormState = {
  success: boolean;
  error?: string;
} | null;

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

export function JobForm({ addJob }: JobFormProps) {
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [state, formAction, isPending] = useActionState(addJob, null);

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
      return inputUrl; // Invalid URL, return as-is
    }
  };

  // Handle URL input - auto-clean tracking params
  const handleUrlChange = (inputUrl: string) => {
    const cleaned = cleanTrackingParams(inputUrl);
    setUrl(cleaned);
  };

  // Check if URL still has remaining query params (non-tracking ones)
  const hasRemainingParams = (() => {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.size > 0;
    } catch {
      return false;
    }
  })();

  // Remove all remaining query params
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
    <div className='max-w-2xl mx-auto px-4 py-8'>
      {/* Success Message */}
      {state?.success && (
        <div className='mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md'>
          <p className='font-medium'>Job added successfully!</p>
          <p className='text-sm mt-1'>You earned 100 points.</p>
        </div>
      )}

      {/* Error Message */}
      {state?.error && (
        <div className='mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md'>
          <p className='font-medium'>Error adding job</p>
          <p className='text-sm mt-1'>{state.error}</p>
        </div>
      )}

      {/* Form */}
      <form action={formAction} className='space-y-6'>
        <div className='bg-white shadow-sm rounded-lg p-6 space-y-5'>
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
              disabled={isPending}
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder='https://company.com/careers/job-id'
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
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
              disabled={isPending}
              placeholder='Senior Product Designer'
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
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
              disabled={isPending}
              placeholder='Upframe'
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
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
              disabled={isPending}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder='Lisbon'
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500'
            />
            <div className='flex gap-2'>
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
        </div>

        {/* Submit Button */}
        <div className='flex justify-end gap-3'>
          <a
            href='/admin'
            className='px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900'
          >
            Cancel
          </a>
          <button
            type='submit'
            disabled={isPending}
            className='px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed'
          >
            {isPending ? 'Adding...' : 'Add Job'}
          </button>
        </div>
      </form>
    </div>
  );
}
