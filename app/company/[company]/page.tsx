import Link from 'next/link';
import { Job } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';
import { FilterableJobBoard } from '@/components/FilterableJobBoard';
import { Suspense, cache } from 'react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

// ─── DATA FETCHING ────────────────────────────────────────────────
const getAllJobs = cache(async (): Promise<Job[]> => {
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
});

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
  params: Promise<{ company: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { company } = await params;
  const decodedCompany = decodeURIComponent(company).replace(/-/g, ' ');
  const jobs = await getAllJobs();

  const companyJobs = jobs.filter(
    (j) =>
      j.is_active && j.company.toLowerCase() === decodedCompany.toLowerCase(),
  );

  const displayCompany =
    companyJobs.length > 0
      ? companyJobs[0].company
      : decodedCompany.replace(/\b\w/g, (char) => char.toUpperCase());

  const activeCount = companyJobs.length;
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

  const [jobs, cities] = await Promise.all([
    getAllJobs(),
    getCitiesWithCounts(),
  ]);

  // ─── JSON-LD STRUCTURED DATA ────────────────────────────────────
  const companyJobs = jobs.filter(
    (j) =>
      j.is_active && j.company.toLowerCase() === decodedCompany.toLowerCase(),
  );

  const displayCompany =
    companyJobs.length > 0
      ? companyJobs[0].company
      : decodedCompany.replace(/\b\w/g, (char) => char.toUpperCase());

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Design Jobs at ${displayCompany}`,
    numberOfItems: companyJobs.length,
    itemListElement: companyJobs.map((job, index) => ({
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

      <div className='flex w-full max-w-195 flex-col items-center py-4 px-2 sm:px-16 bg-background sm:items-start'>
        <header className='w-full bg-[#0237CF] text-white p-2 rounded-lg'>
          <div className='font-semibold ml-1 flex gap-3'>
            <Link href='/'>Design Jobs</Link>
          </div>
        </header>

        <Suspense fallback={<div>Loading...</div>}>
          <FilterableJobBoard
            allJobs={jobs}
            initialFilter={{ type: 'company', value: decodedCompany }}
            cities={cities}
          />
        </Suspense>
      </div>
    </div>
  );
}
