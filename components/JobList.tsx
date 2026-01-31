'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { Job } from '@/lib/types';
import { buildJobUrl, formatRelativeDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface JobListProps {
  jobs: Job[];
  jobsPerPage?: number;
}

export function JobList({ jobs, jobsPerPage = 25 }: JobListProps) {
  const posthog = usePostHog();

  // Step 1: Filter to only active jobs (this is your "dataset")
  const activeJobs = jobs.filter((job) => job.is_active);

  // Step 2: Track which page we're on (1-indexed for human readability)
  const [currentPage, setCurrentPage] = useState(1);

  // Step 3: Track if this is the initial mount (to skip scrolling on first render)
  const isInitialMount = useRef(true);

  // Step 4: Calculate derived values
  const totalJobs = activeJobs.length;
  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  // Step 5: Calculate the "window" into our array
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const visibleJobs = activeJobs.slice(startIndex, endIndex);

  // Scroll to top when currentPage changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleJobClick = (job: Job) => {
    posthog?.capture('job_clicked', {
      job_id: job.id,
      job_title: job.title,
      company: job.company,
      url: job.url,
    });
  };

  // Navigation handlers
  const goToPage = (page: number) => {
    // Clamp to valid range
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);

    // Track pagination usage
    posthog?.capture('pagination_clicked', {
      from_page: currentPage,
      to_page: validPage,
      total_pages: totalPages,
    });
  };

  return (
    <div>
      {/* Job listings */}
      <ul className='space-y-2 mt-2 p-2 text-[#3d2800]'>
        {visibleJobs.map((job) => (
          <li
            className='list-none hover:bg-muted rounded-sm transition-all cursor-pointer p-[0.1rem] border border-transparent hover:border-border border-dashed'
            key={job.id}
          >
            <Link
              onClick={() => handleJobClick(job)}
              href={buildJobUrl(job.url)}
              target='_blank'
            >
              <div className='text-lg font-normal text-foreground'>
                {job.title}
              </div>
            </Link>
            <div className='flex text-sm gap-1 text-gray-900'>
              <div className='font-medium'>{job.company}</div>
              <div>
                <span>| </span>
                {job.location}
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
          className='flex items-center justify-between px-2 py-4 border-t border-border'
        >
          {/* Page indicator */}
          <p className='text-sm text-gray-700'>
            Page {currentPage} of {totalPages}
          </p>

          {/* Navigation buttons */}
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
