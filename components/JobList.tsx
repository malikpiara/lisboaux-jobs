// components/JobList.tsx

'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { Job } from '@/lib/types';
import { buildJobUrl, formatRelativeDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type SourcePageType = 'homepage' | 'location' | 'company';

interface JobListProps {
  jobs: Job[];
  jobsPerPage?: number;
  sourcePageType?: SourcePageType;
  onCompanyClick?: (companyName: string) => void;
  onLocationClick?: (locationName: string) => void;
}

const EASE_OUT = 'cubic-bezier(0.165, 0.84, 0.44, 1)';

export function JobList({
  jobs,
  jobsPerPage = 25,
  sourcePageType = 'homepage',
  onCompanyClick,
  onLocationClick,
}: JobListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const posthog = usePostHog();

  // ─── REDUCED MOTION ─────────────────────────────────────────
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ─── PAGINATION STATE ──────────────────────────────────────
  const [pendingPage, setPendingPage] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isInitialMount = useRef(true);

  const urlPage = Number(searchParams.get('page')) || 1;
  const displayPage = pendingPage ?? urlPage;

  // Clear pendingPage once URL catches up
  useEffect(() => {
    if (pendingPage !== null && urlPage === pendingPage) {
      setPendingPage(null);
    }
  }, [urlPage, pendingPage]);

  // Disable browser scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // ─── RESET PAGE ON FILTER CHANGE ──────────────────────────
  // When the pathname changes (filter applied by parent),
  // reset pagination to page 1. We track the previous pathname
  // to detect actual filter changes vs. query param updates.
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setPendingPage(null);
      // Don't touch the URL here — the parent already pushed
      // the new pathname. We just reset local page state.
    }
  }, [pathname]);

  // ─── DERIVED VALUES ────────────────────────────────────────
  const totalJobs = jobs.length;
  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  // Clamp displayPage if filter reduced total pages
  const safePage = Math.min(displayPage, Math.max(totalPages, 1));

  const startIndex = (safePage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const visibleJobs = jobs.slice(startIndex, endIndex);

  // Scroll to top when page changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [safePage]);

  // ─── HANDLERS ──────────────────────────────────────────────
  const handleJobClick = (job: Job) => {
    posthog?.capture('job_clicked', {
      job_id: job.id,
      job_title: job.title,
      company: job.company,
      url: job.url,
      source_page_type: sourcePageType,
    });
  };

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setIsTransitioning(true);

    setTimeout(() => {
      setPendingPage(validPage);
      setIsTransitioning(false);

      // Preserve current pathname, only update ?page
      const params = new URLSearchParams(searchParams.toString());
      if (validPage === 1) {
        params.delete('page');
      } else {
        params.set('page', String(validPage));
      }

      const query = params.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;
      router.push(newUrl, { scroll: false });
    }, 150);

    posthog?.capture('pagination_clicked', {
      from_page: safePage,
      to_page: validPage,
      total_pages: totalPages,
    });
  };

  // ─── PAGINATION TRANSITION STYLES ─────────────────────────
  const transitionStyle = reducedMotion
    ? { opacity: isTransitioning ? 0.5 : 1, transition: 'none' }
    : {
        opacity: isTransitioning ? 0.5 : 1,
        filter: isTransitioning ? 'blur(2px)' : 'blur(0px)',
        transition: isTransitioning
          ? `opacity 150ms ${EASE_OUT}, filter 150ms ${EASE_OUT}`
          : `opacity 250ms ${EASE_OUT}, filter 250ms ${EASE_OUT}`,
      };

  return (
    <div>
      <ul style={transitionStyle} className='text-[#3d2800] w-full'>
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
            <div className='flex text-sm gap-1 text-muted-foreground dark:text-[#ffffffc9] whitespace-nowrap overflow-hidden items-center'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCompanyClick?.(job.company);
                }}
                className='font-medium hover:text-foreground hover:underline transition-colors cursor-pointer truncate max-w-[150px] sm:max-w-none'
              >
                {job.company}
              </button>
              <div>
                <span>| </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLocationClick?.(job.location);
                  }}
                  className='hover:text-foreground hover:underline transition-colors cursor-pointer'
                >
                  {job.location}
                </button>
              </div>
              <div>
                <span>| </span>
                {formatRelativeDate(job.submitted_on)}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label='Job listings pagination'
          className='flex items-center justify-between px-2 py-4 border-border'
        >
          <p className='text-sm text-gray-700 dark:text-[#ffffff]/50'>
            Page {safePage} of {totalPages}
          </p>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
