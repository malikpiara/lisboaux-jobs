import { TransitionLink as Link } from '@/components/TransitionLink';
import { Job } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { JobList } from '@/components/JobList';
import { Suspense, cache } from 'react';
import { Metadata } from 'next';
import { PageTransition } from '@/components/PageTransition';

export const dynamic = 'force-dynamic';

// ─── DATA FETCHING ────────────────────────────────────────────────
// cache() deduplicates this call within a single request.
// Both generateMetadata and the page component call this with
// the same argument — the second call returns the memoized result
// instead of hitting the database again.
const getJobsByCompany = cache(async (company: string): Promise<Job[]> => {
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
});

// ─── SEO: DYNAMIC METADATA ───────────────────────────────────────
type PageProps = {
  params: Promise<{ company: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { company } = await params;
  const decodedCompany = decodeURIComponent(company).replace(/-/g, ' ');
  const jobs = await getJobsByCompany(decodedCompany);

  const displayCompany =
    jobs.length > 0
      ? jobs[0].company
      : decodedCompany.replace(/\b\w/g, (char) => char.toUpperCase());

  const activeCount = jobs.filter((j) => j.is_active).length;
  const slug = company.toLowerCase();

  return {
    title: `Design Jobs at ${displayCompany} | LisboaUX`,
    description: `Browse ${activeCount} active design ${activeCount === 1 ? 'job' : 'jobs'} at ${displayCompany} in Portugal. Find UX, UI, and product design roles on LisboaUX.`,
    alternates: {
      canonical: `https://jobs.lisboaux.com/company/${slug}`,
    },
  };
}

// ─── PAGE COMPONENT ───────────────────────────────────────────────
export default async function CompanyPage({ params }: PageProps) {
  const { company } = await params;
  const decodedCompany = decodeURIComponent(company).replace(/-/g, ' ');
  const jobs = await getJobsByCompany(decodedCompany);

  const displayCompany =
    jobs.length > 0
      ? jobs[0].company
      : decodedCompany.replace(/\b\w/g, (char) => char.toUpperCase());

  const activeCount = jobs.filter((j) => j.is_active).length;

  // ─── JSON-LD STRUCTURED DATA ────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Design Jobs at ${displayCompany}`,
    numberOfItems: activeCount,
    itemListElement: jobs
      .filter((j) => j.is_active)
      .map((job, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'JobPosting',
          title: job.title,
          hiringOrganization: {
            '@type': 'Organization',
            name: job.company,
          },
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: job.location,
              addressCountry: 'PT',
            },
          },
          datePosted: job.submitted_on,
        },
      })),
  };

  return (
    <div className='flex flex-col items-center justify-center font-sans bg-background'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className='flex w-full max-w-195 flex-col items-center py-4 px-3 sm:px-16 bg-background sm:items-start'>
        <header className='w-full bg-[#0237CF] text-white p-2 rounded-lg'>
          <div className='font-semibold ml-1 flex gap-3'>
            <Link href='/'>Design Jobs</Link>
          </div>
        </header>
        <PageTransition>
          <div className='w-full flex items-center justify-between py-4 px-2'>
            <h1 className='text-lg font-semibold text-foreground'>
              Design Jobs at{' '}
              <span className='inline-flex items-baseline gap-1.5'>
                <span className='text-primary border-b border-dashed border-primary/60'>
                  {displayCompany}
                </span>
                <Link
                  href='/'
                  className='opacity-30 hover:opacity-100 transition-opacity text-muted-foreground'
                  aria-label={`Clear ${displayCompany} filter`}
                >
                  <svg
                    className='w-3.5 h-3.5 relative top-px'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </Link>
              </span>
            </h1>
            <p className='text-sm text-muted-foreground'>
              {activeCount} active {activeCount === 1 ? 'job' : 'jobs'}
            </p>
          </div>

          <main className='w-full bg-background rounded-b-sm'>
            <Suspense fallback={<div>Loading...</div>}>
              <JobList jobs={jobs} sourcePageType='company' />
            </Suspense>
          </main>
        </PageTransition>
      </div>
    </div>
  );
}
