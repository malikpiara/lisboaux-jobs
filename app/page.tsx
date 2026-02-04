import Link from 'next/link';
import { Job } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { JobList } from '@/components/JobList';
import { generateJobPostingSchema } from '@/lib/seo/jobPostingSchema';
import Image from 'next/image';

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
          <section>
            <MockupA />
          </section>
        </footer>
      </div>
    </>
  );
}

// Mockup A: Minimal Badge Card
// Philosophy: Ultra-clean, matches your minimal job listing aesthetic
const MockupA = () => (
  <div className='w-64 bg-background rounded-xl border border-border shadow-sm overflow-hidden right-10 bottom-10 fixed hidden  md:block'>
    {/* Photo with subtle overlay */}
    <div className='relative'>
      <Image
        width={300}
        height={300}
        src={'/isabel.jpeg'}
        alt='Isabel Novais Machado - Person of the Year'
        className='w-full aspect-square object-cover'
      />
      {/* Year badge */}
      <div className='absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-[#fa8072] text-[#78350f]'>
        ⭐ 2025
      </div>
    </div>

    {/* Content */}
    <div className='p-4'>
      <p
        className='text-xs font-semibold uppercase tracking-wider mb-1'
        style={{ color: '#0237cf' }}
      >
        Person of the Year
      </p>
      <h3 className='text-lg font-bold mb-3 text-foreground'>
        Isabel Novais Machado
      </h3>

      {/* Links */}
      <div className='flex flex-col gap-2'>
        <Link
          href='https://www.linkedin.com/feed/update/urn:li:activity:7424848804094418944'
          className='flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-90'
          style={{ backgroundColor: '#0237cf', color: '#ffffff' }}
        >
          Read the Story →
        </Link>
        <Link
          href='https://www.linkedin.com/in/isabelnovais'
          className='flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors hover:border-[#0237cf] dark:text-[#ffffff]/50'
        >
          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
            <path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' />
          </svg>
          View Profile
        </Link>
      </div>
    </div>
  </div>
);
