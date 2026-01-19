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

      <div className='flex flex-col items-center justify-center bg-white font-sans'>
        <div className='flex w-full max-w-3xl flex-col items-center py-4 px-2 sm:px-16 bg-white sm:items-start'>
          <header className='w-full bg-[#3847E6] text-white p-1 rounded-t-sm'>
            <div className='font-semibold'>
              <Link href={'/'}>Design Jobs</Link>
            </div>
          </header>
          <main className='w-full bg-[#FFF7F1] rounded-b-sm'>
            <JobList jobs={jobs} />
          </main>
        </div>
        <footer className='justify-between gap-6 flex sm:items-center items-start max-w-3xl w-full p-2 flex-col-reverse sm:flex-row sm:px-16 opacity-80 text-sm'>
          <div className='sm:self-start'>⛹️ Only You Know Who You Can Be</div>
          <section className='flex flex-col gap-2'>
            <div>
              <Link
                href={'https://whatsapp.com/channel/0029VbBgMmb6hENv6HkmMt2R'}
              >
                Job Alerts on WhatsApp
              </Link>
            </div>
            <div>
              <Link href={'https://lisboaux.com/slack'}>
                Join our Slack Community
              </Link>
            </div>
          </section>
        </footer>
      </div>
    </>
  );
}
