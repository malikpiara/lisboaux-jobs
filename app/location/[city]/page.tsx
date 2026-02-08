import { TransitionLink as Link } from '@/components/TransitionLink';
import { Job } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { JobList } from '@/components/JobList';
import { CityFilterInline } from '@/components/CityFilterInline';
import { Suspense, cache } from 'react';
import { Metadata } from 'next';
import { PageTransition } from '@/components/PageTransition';

export const dynamic = 'force-dynamic';

// ─── DATA FETCHING ────────────────────────────────────────────────
// cache() deduplicates within a single request — generateMetadata
// and the page component share the same result without hitting
// the database twice.
const getJobsByCity = cache(async (city: string): Promise<Job[]> => {
  const supabase = await createClient();

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
});

// ─── FETCH DISTINCT CITIES WITH COUNTS ────────────────────────────
// Queries all active jobs and groups by location to build the
// picker options. Returns sorted by count (most jobs first).
// Also wrapped in cache() since generateMetadata could call it too
// if we ever want city counts in the meta description.
const getCitiesWithCounts = cache(
  async (): Promise<{ name: string; count: number }[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('jobs')
      .select('location')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching city counts:', error);
      return [];
    }

    // Group by location and count occurrences
    const counts: Record<string, number> = {};
    for (const job of data ?? []) {
      const loc = job.location ?? 'Unknown';
      counts[loc] = (counts[loc] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  },
);

// ─── SEO: DYNAMIC METADATA ───────────────────────────────────────
type PageProps = {
  params: Promise<{ city: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city } = await params;
  const decodedCity = decodeURIComponent(city).replace(/-/g, ' ');
  const jobs = await getJobsByCity(decodedCity);

  const displayCity =
    decodedCity.charAt(0).toUpperCase() + decodedCity.slice(1);

  const activeCount = jobs.filter((j) => j.is_active).length;
  const slug = city.toLowerCase();

  return {
    title: `Design Jobs in ${displayCity} | LisboaUX`,
    description: `Browse ${activeCount} active design ${activeCount === 1 ? 'job' : 'jobs'} in ${displayCity}, Portugal. Find UX, UI, and product design roles on LisboaUX.`,
    alternates: {
      canonical: `https://jobs.lisboaux.com/location/${slug}`,
    },
  };
}

// ─── PAGE COMPONENT ───────────────────────────────────────────────
export default async function LocationPage({ params }: PageProps) {
  const { city } = await params;
  const decodedCity = decodeURIComponent(city).replace(/-/g, ' ');

  // Fetch jobs and city options in parallel
  const [jobs, cities] = await Promise.all([
    getJobsByCity(decodedCity),
    getCitiesWithCounts(),
  ]);

  const displayCity =
    decodedCity.charAt(0).toUpperCase() + decodedCity.slice(1);

  const activeCount = jobs.filter((j) => j.is_active).length;

  // ─── JSON-LD STRUCTURED DATA ────────────────────────────────────
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Design Jobs in ${displayCity}`,
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
              Design Jobs in{' '}
              <CityFilterInline currentCity={displayCity} cities={cities} />
            </h1>
            <p className='text-sm text-muted-foreground'>
              {activeCount} active {activeCount === 1 ? 'job' : 'jobs'}
            </p>
          </div>

          <main className='w-full bg-background rounded-b-sm'>
            <Suspense fallback={<div>Loading...</div>}>
              <JobList jobs={jobs} sourcePageType='location' />
            </Suspense>
          </main>
        </PageTransition>
      </div>
    </div>
  );
}
