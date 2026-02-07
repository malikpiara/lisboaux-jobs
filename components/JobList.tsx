'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { Job } from '@/lib/types';
import { buildJobUrl, formatRelativeDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── SOURCE PAGE TYPE ──────────────────────────────────────────
// This prop tells PostHog which type of page the user is on.
// It's passed by the parent page component, so JobList stays
// generic and reusable — it doesn't need to know about URLs.
//
// Why a prop instead of parsing window.location?
// 1. JobList is a presentational component — it shouldn't know
//    about your URL structure
// 2. Props are explicit and type-safe — you can't misspell a value
// 3. It works in tests without mocking window.location
type SourcePageType = 'homepage' | 'location' | 'company';

interface JobListProps {
  jobs: Job[];
  jobsPerPage?: number;
  sourcePageType?: SourcePageType;
}

// ─── SLUG HELPER ────────────────────────────────────────────────
// Converts "Lisbon" → "lisbon", "São Paulo" → "são-paulo"
// encodeURIComponent then handles special characters for the URL:
//   "são-paulo" → "s%C3%A3o-paulo"
// On the other end, your [city]/page.tsx decodes it back.
//
// Why not just toLowerCase()? Because spaces in URLs are ugly
// and can cause issues. Replacing them with hyphens is the
// standard convention (called "slugifying").
function toSlug(value: string): string {
  return encodeURIComponent(value.trim().toLowerCase().replace(/\s+/g, '-'));
}

export function JobList({
  jobs,
  jobsPerPage = 25,
  sourcePageType = 'homepage',
}: JobListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const posthog = usePostHog();

  // pendingPage is only set during the animation transition
  const [pendingPage, setPendingPage] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isInitialMount = useRef(true);

  // The page we render from: pendingPage during animation, URL otherwise
  const urlPage = Number(searchParams.get('page')) || 1;
  const displayPage = pendingPage ?? urlPage;

  // Clear pendingPage once URL catches up
  useEffect(() => {
    if (pendingPage !== null && urlPage === pendingPage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingPage(null);
    }
  }, [urlPage, pendingPage]);

  // Disable browser scroll restoration — we handle it ourselves
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Filter to only active jobs
  const activeJobs = jobs.filter((job) => job.is_active);

  // Calculate derived values
  const totalJobs = activeJobs.length;
  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  // Calculate the "window" into our array using displayPage
  const startIndex = (displayPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const visibleJobs = activeJobs.slice(startIndex, endIndex);

  // Scroll to top when displayPage changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [displayPage]);

  const handleJobClick = (job: Job) => {
    posthog?.capture('job_clicked', {
      job_id: job.id,
      job_title: job.title,
      company: job.company,
      url: job.url,
      source_page_type: sourcePageType,
    });
  };

  // Navigation handler: snappy animation + URL sync
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setIsTransitioning(true);

    setTimeout(() => {
      // Instant content swap and fade back in
      setPendingPage(validPage);
      setIsTransitioning(false);

      // Sync URL in the background for back button and bookmarks
      const params = new URLSearchParams(searchParams.toString());
      if (validPage === 1) {
        params.delete('page');
      } else {
        params.set('page', String(validPage));
      }
      router.push(`?${params.toString()}`, { scroll: false });
    }, 150);

    posthog?.capture('pagination_clicked', {
      from_page: displayPage,
      to_page: validPage,
      total_pages: totalPages,
    });
  };

  return (
    <div>
      {/* Job listings */}
      <ul
        className={`
          text-[#3d2800]
          transition-[opacity,filter] duration-150 ease
          ${isTransitioning ? 'opacity-50 blur-xs' : 'opacity-100 blur-none'}
        `}
      >
        {visibleJobs.map((job) => (
          <li
            className='list-none hover:bg-muted dark:hover:bg-white/12 transition-all cursor-pointer p-[0.1rem] hover:border-border border-dashed border-b border-border py-3 px-3'
            key={job.id}
          >
            <Link
              onClick={() => handleJobClick(job)}
              href={buildJobUrl(job.url)}
              target='_blank'
            >
              <div className='text-lg font-medium text-foreground'>
                {job.title}
              </div>
            </Link>
            <div className='flex text-sm gap-1 text-muted-foreground dark:text-[#ffffffc9]'>
              {/* ─── CLICKABLE COMPANY ──────────────────────── */}
              {/* Links to /company/[slug] for filtered view     */}
              <Link
                href={`/company/${toSlug(job.company)}`}
                className='font-medium hover:text-foreground hover:underline transition-colors'
              >
                {job.company}
              </Link>
              <div>
                <span>| </span>
                {/* ─── CLICKABLE LOCATION ─────────────────────── */}
                {/* Links to /location/[slug] for filtered view    */}
                <Link
                  href={`/location/${toSlug(job.location)}`}
                  className='hover:text-foreground hover:underline transition-colors'
                >
                  {job.location}
                </Link>
              </div>
              <div>
                <span>| </span>
                {formatRelativeDate(job.submitted_on)}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination controls - only show if more than one page */}
      {totalPages > 1 && (
        <nav
          aria-label='Job listings pagination'
          className='flex items-center justify-between px-2 py-4 border-border'
        >
          <p className='text-sm text-gray-700 dark:text-[#ffffff]/50'>
            Page {displayPage} of {totalPages}
          </p>

          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => goToPage(displayPage - 1)}
              disabled={displayPage === 1}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => goToPage(displayPage + 1)}
              disabled={displayPage === totalPages}
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
