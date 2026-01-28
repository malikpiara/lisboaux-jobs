'use client';

/**
 * JobsTableWithSheet Component
 *
 * This is a "container" or "smart" component that:
 * 1. Manages which job is being edited (selectedJob state)
 * 2. Passes the click handler to the table
 * 3. Passes the selected job to the sheet
 *
 * WHY THIS PATTERN?
 * ─────────────────────────────────────────────────────────────────
 * The table and sheet need to communicate:
 * - Table: "User clicked this job"
 * - Sheet: "Show form for this job"
 *
 * React's answer: Lift state to a common ancestor.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  JobsTableWithSheet (manages selectedJob state)            │
 * │       │                                           │        │
 * │       ▼                                           ▼        │
 * │  JobsDataTable                              EditJobSheet   │
 * │  (calls onRowClick)                    (displays job form) │
 * └─────────────────────────────────────────────────────────────┘
 */

import { useState, useMemo } from 'react';
import { JobsDataTable } from './data-table';
import { EditJobSheet } from './edit-job-sheet';
import { getColumns, type Job } from './columns';

interface JobsTableWithSheetProps {
  initialJobs: Job[];
}

export function JobsTableWithSheet({ initialJobs }: JobsTableWithSheetProps) {
  // Which job is currently being edited?
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Is the sheet open?
  const [sheetOpen, setSheetOpen] = useState(false);

  /**
   * Handle row click: open the sheet with the selected job
   */
  const handleRowClick = (job: Job) => {
    setSelectedJob(job);
    setSheetOpen(true);
  };

  /**
   * Handle sheet close: clear selection
   *
   * Note: We DON'T clear selectedJob immediately because
   * the sheet needs the job data during the close animation.
   * React will keep rendering with the old job until the sheet
   * finishes closing.
   */
  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    // Only clear selection after sheet is closed
    if (!open) {
      // Small delay to let animation complete
      setTimeout(() => setSelectedJob(null), 200);
    }
  };

  /**
   * Memoize columns to prevent unnecessary re-renders
   *
   * Without useMemo, getColumns would be called on every render,
   * creating new column objects each time. This would cause
   * TanStack Table to think the columns changed and re-render
   * the entire table.
   */
  const columns = useMemo(() => getColumns(handleRowClick), []);

  return (
    <>
      <JobsDataTable columns={columns} data={initialJobs} />

      <EditJobSheet
        job={selectedJob}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
    </>
  );
}
