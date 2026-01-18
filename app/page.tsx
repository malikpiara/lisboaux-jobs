import { buildJobUrl, formatRelativeDate } from '@/lib/utils';
import Link from 'next/link';
import { Job } from '@/lib/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
  return (
    <div className='flex min-h-screen items-center justify-center bg-white font-sans'>
      <div className='flex min-h-screen w-full max-w-3xl flex-col items-center py-4 px-2 sm:px-16 bg-white sm:items-start'>
        <header className='w-full bg-[#3847E6] text-white p-1 rounded-t-sm'>
          <div className='font-semibold'>
            <Link href={'/'}>Design Jobs</Link>
          </div>
        </header>
        <main className='w-full bg-[#FFF7F1] rounded-b-sm'>
          <ul className='space-y-2 mt-2 p-2'>
            {jobs
              .filter((job) => job.is_active)
              .map((job) => (
                <li
                  className='list-none hover:opacity-50 transition-colors cursor-pointer'
                  key={job.id}
                >
                  <Link href={buildJobUrl(job.url)} target='_blank'>
                    <div className='text-lg'>{job.title}</div>
                  </Link>
                  <div className='flex text-sm gap-2'>
                    <div>{job.company}</div>
                    <div>{job.location}</div>
                    <div>{formatRelativeDate(job.submitted_on)}</div>
                  </div>
                </li>
              ))}
          </ul>
        </main>
      </div>
    </div>
  );
}
