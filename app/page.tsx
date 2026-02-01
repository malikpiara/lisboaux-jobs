import Link from 'next/link';
import { Job } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { JobList } from '@/components/JobList';
import { generateJobPostingSchema } from '@/lib/seo/jobPostingSchema';

export const dynamic = 'force-dynamic';

async function getJobs(): Promise<Job[]> {
  const supabase = await createClient();

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

      <div className='flex flex-col items-center justify-center font-sans bg-card'>
        <div className='flex w-full max-w-195 flex-col items-center py-4 px-2 sm:px-16 bg-card sm:items-start'>
          <header className='w-full bg-[#0237CF] text-white p-1 rounded-t-sm dark:border-t dark:border-x'>
            <div className='font-semibold ml-1 flex gap-3'>
              <Link href={'/'}>Design Jobs</Link>
            </div>
          </header>
          <main className='w-full bg-background rounded-b-sm dark:border-x dark:border-b'>
            <JobList jobs={jobs} />
          </main>
        </div>
        <footer className='gap-6 flex  items-start max-w-195 w-full p-2 flex-col-reverse sm:flex-row sm:px-16 text-base  sm:text-sm text-[#3d2800] dark:text-[#ffffff]/50'>
          <section className='flex flex-col sm:flex-row gap-5 mb-3'>
            <div>
              <Link
                className='dark:hover:text-white transition-colors'
                href={'https://whatsapp.com/channel/0029VbBgMmb6hENv6HkmMt2R'}
              >
                Job Alerts on WhatsApp
              </Link>
            </div>
            <div className='hidden sm:block'>|</div>
            <div>
              <Link
                className='dark:hover:text-white transition-colors'
                href={'https://t.me/ux_jobs'}
              >
                Job Alerts on Telegram
              </Link>
            </div>
            <div className='hidden sm:block'>|</div>
            <div>
              <Link
                className='dark:hover:text-white transition-colors'
                href={'https://lisboaux.com/slack'}
              >
                Join our Slack Community
              </Link>
            </div>
          </section>
        </footer>
      </div>
    </>
  );
}
