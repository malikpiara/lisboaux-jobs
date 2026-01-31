'use client';

import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { Job } from '@/lib/types';
import { buildJobUrl, formatRelativeDate } from '@/lib/utils';

interface JobListProps {
  jobs: Job[];
}

export function JobList({ jobs }: JobListProps) {
  const posthog = usePostHog();

  const handleJobClick = (job: Job) => {
    posthog?.capture('job_clicked', {
      job_id: job.id,
      job_title: job.title,
      company: job.company,
      url: job.url,
    });
  };

  return (
    <ul className='space-y-2 mt-2 p-2 text-[#3d2800]'>
      {jobs
        .filter((job) => job.is_active)
        .map((job) => (
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
  );
}
