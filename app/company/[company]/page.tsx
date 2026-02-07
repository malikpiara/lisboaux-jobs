// app/company/[company]/page.tsx

import Link from 'next/link';
import { Job } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { JobList } from '@/components/JobList';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

// ─── DATA FETCHING ────────────────────────────────────────────────
// Same pattern as the location page, but querying the 'company' column.
// ILIKE handles casing: "huspy" matches "Huspy" in the database.
async function getJobsByCompany(company: string): Promise<Job[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .ilike('company', `%${company}%`)
    .order('submitted_on', { ascending: false });

  if (error) {
    console.error('Error fetching jobs by company:', error);
    return [];
  }

  return data ?? [];
}

// ─── PARAMS TYPE ──────────────────────────────────────────────────
// The key "company" matches the folder name: [company]
type PageProps = {
  params: Promise<{ company: string }>;
};

export default async function CompanyPage({ params }: PageProps) {
  const { company } = await params;

  // Decode URL encoding AND convert hyphens back to spaces
  // so "smart-consulting" becomes "smart consulting"
  // and ILIKE '%smart consulting%' matches "Smart Consulting"
  const decodedCompany = decodeURIComponent(company).replace(/-/g, ' ');

  const jobs = await getJobsByCompany(decodedCompany);

  // Format for display: "smart consulting" → "Smart Consulting"
  // This capitalizes the first letter of each word (title case)
  const displayCompany = decodedCompany.replace(/\b\w/g, (char) =>
    char.toUpperCase(),
  );

  return (
    <div className='flex flex-col items-center justify-center font-sans bg-background'>
      <div className='flex w-full max-w-195 flex-col items-center py-4 px-2 sm:px-16 bg-background sm:items-start'>
        <header className='w-full bg-[#0237CF] text-white p-2 rounded-lg'>
          <div className='font-semibold ml-1 flex gap-3'>
            <Link href='/'>Design Jobs</Link>
          </div>
        </header>

        {/* ─── CONTEXT BAR ─────────────────────────────────── */}
        <div className='w-full flex items-center justify-between py-4 px-1'>
          <div>
            <h1 className='text-lg font-semibold text-foreground'>
              Design Jobs at {displayCompany}
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

        <main className='w-full bg-background rounded-b-sm'>
          <Suspense fallback={<div>Loading...</div>}>
            <JobList jobs={jobs} sourcePageType='company' />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
