// app/location/[city]/page.tsx

import Link from 'next/link';
import { Job } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { JobList } from '@/components/JobList';
import { Suspense } from 'react';

// ─── WHY force-dynamic? ───────────────────────────────────────────
// This tells Next.js: "Don't try to cache this page at build time."
// Since your job data changes frequently (new jobs added, old ones deactivated),
// you want fresh data on every request. Without this, Next.js might serve
// a stale, pre-rendered version.
export const dynamic = 'force-dynamic';

// ─── THE DATA FETCHING FUNCTION ───────────────────────────────────
// This runs on the SERVER only (never shipped to the browser).
// It's just an async function — no hooks, no client state.
async function getJobsByCity(city: string): Promise<Job[]> {
  const supabase = await createClient();

  // ILIKE = case-insensitive LIKE (PostgreSQL-specific)
  // The % wildcards mean "match anywhere in the string"
  // So "lisbon" matches "Lisbon", "Lisbon, Portugal", "Greater Lisbon Area"
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .ilike('location', `%${city}%`)
    .order('submitted_on', { ascending: false });

  if (error) {
    console.error('Error fetching jobs by city:', error);
    return [];
  }

  return data ?? [];
}

// ─── PARAMS TYPE ──────────────────────────────────────────────────
// In Next.js 15+, params is a Promise that must be awaited.
// The key "city" matches your folder name: [city]
// If your folder was [location], this would be params.location
type PageProps = {
  params: Promise<{ city: string }>;
};

// ─── THE PAGE COMPONENT ───────────────────────────────────────────
// This is a Server Component by default (no 'use client' directive).
// It can be async, which means it can fetch data directly.
export default async function LocationPage({ params }: PageProps) {
  const { city } = await params;

  // decodeURIComponent handles URL encoding:
  // "/location/s%C3%A3o%20paulo" → "são paulo"
  // replace(/-/g, ' ') converts hyphens back to spaces:
  // "sao-paulo" → "sao paulo" so ILIKE matches "São Paulo"
  const decodedCity = decodeURIComponent(city).replace(/-/g, ' ');

  const jobs = await getJobsByCity(decodedCity);

  // Format for display: "lisbon" → "Lisbon"
  const displayCity =
    decodedCity.charAt(0).toUpperCase() + decodedCity.slice(1);

  return (
    <div className='flex flex-col items-center justify-center font-sans bg-background'>
      <div className='flex w-full max-w-195 flex-col items-center py-4 px-2 sm:px-16 bg-background sm:items-start'>
        {/* ─── HEADER ──────────────────────────────────────── */}
        {/* Same header as your homepage for visual consistency */}
        <header className='w-full bg-[#0237CF] text-white p-2 rounded-lg'>
          <div className='font-semibold ml-1 flex gap-3'>
            <Link href='/'>Design Jobs</Link>
          </div>
        </header>

        {/* ─── CONTEXT BAR ─────────────────────────────────── */}
        {/* This is important UX: tell the user WHERE they are */}
        {/* and give them a clear way back to all jobs.        */}
        <div className='w-full flex items-center justify-between py-4 px-1'>
          <div>
            <h1 className='text-lg font-semibold text-foreground'>
              Design Jobs in {displayCity}
            </h1>
            <p className='text-sm text-muted-foreground'>
              {jobs.filter((j) => j.is_active).length} active{' '}
              {jobs.filter((j) => j.is_active).length === 1 ? 'job' : 'jobs'}
            </p>
          </div>
          <Link
            href='/'
            className='text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            ← All Jobs
          </Link>
        </div>

        {/* ─── JOB LIST ────────────────────────────────────── */}
        {/* This is the key reuse: same component, different data */}
        <main className='w-full bg-background rounded-b-sm'>
          <Suspense fallback={<div>Loading...</div>}>
            <JobList jobs={jobs} sourcePageType='location' />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
