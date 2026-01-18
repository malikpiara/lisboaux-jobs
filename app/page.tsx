import Link from 'next/link';
import { Job } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { JobList } from '@/components/JobList';
import { generateJobPostingSchema } from '@/lib/seo/jobPostingSchema';

export const dynamic = 'force-dynamic';

async function getJobs(): Promise<Job[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('submitted_on', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }

  return data ?? [];
}

export default async function Home() {
  const jobs = await getJobs();
  const jobSchema = generateJobPostingSchema(jobs);

  return (
    <>
      {/* Structured data for search engines (invisible to users) */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobSchema) }}
      />

      <div className='flex min-h-screen items-center justify-center bg-white font-sans'>
        <div className='flex min-h-screen w-full max-w-3xl flex-col items-center py-4 px-2 sm:px-16 bg-white sm:items-start'>
          <header className='w-full bg-[#3847E6] text-white p-1 rounded-t-sm'>
            <div className='font-semibold'>
              <Link href={'/'}>Design Jobs</Link>
            </div>
          </header>
          <main className='w-full bg-[#FFF7F1] rounded-b-sm'>
            <JobList jobs={jobs} />
          </main>
        </div>
      </div>
    </>
  );
}
