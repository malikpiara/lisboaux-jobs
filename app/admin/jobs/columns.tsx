'use client';

/**
 * Column Definitions for Jobs Table
 *
 * TanStack Table uses a "column definition" pattern where you describe:
 * - What data to access (accessorKey or accessorFn)
 * - How to render it (cell)
 * - Header text and behavior (header)
 * - Whether it's sortable, filterable, etc.
 *
 * This is DECLARATIVE — you describe WHAT you want, not HOW to do it.
 * TanStack Table handles the implementation details.
 */

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITION
// ─────────────────────────────────────────────────────────────────

/**
 * This type should match your Supabase jobs table.
 * Keeping types close to where they're used makes the code easier to understand.
 * For a larger app, you might generate these from your database schema.
 */
export type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  url: string;
  submitted_on: string | null;
  is_active: boolean;
  short_code: string | null;
  created_by: string | null;
  modified_by: string | null;
  updated_at: string | null;
};

// ─────────────────────────────────────────────────────────────────
// COLUMN DEFINITIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Why is this a function that takes onRowClick?
 *
 * Columns need to be defined on the client (they use React components),
 * but the click handler comes from the parent component.
 * This pattern lets us inject the handler while keeping columns reusable.
 */
export function getColumns(onRowClick: (job: Job) => void): ColumnDef<Job>[] {
  return [
    // ─────────────────────────────────────────────────────────────
    // STATUS COLUMN
    // ─────────────────────────────────────────────────────────────
    {
      accessorKey: 'is_active',
      header: 'Status',
      /**
       * `cell` receives the cell context with:
       * - row.original: the full data object
       * - getValue(): the value for this column
       */
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean;
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
      // Smaller width for status
      size: 100,
    },

    // ─────────────────────────────────────────────────────────────
    // TITLE COLUMN (clickable)
    // ─────────────────────────────────────────────────────────────
    {
      accessorKey: 'title',
      header: 'Job Title',
      cell: ({ row }) => {
        const job = row.original;
        return (
          <button
            onClick={() => onRowClick(job)}
            className='text-left font-medium text-foreground hover:underline'
          >
            {job.title}
          </button>
        );
      },
    },

    // ─────────────────────────────────────────────────────────────
    // COMPANY COLUMN
    // ─────────────────────────────────────────────────────────────
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => (
        <span className='text-gray-900'>{row.getValue('company')}</span>
      ),
    },

    // ─────────────────────────────────────────────────────────────
    // LOCATION COLUMN
    // ─────────────────────────────────────────────────────────────
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => (
        <span className='text-gray-600'>{row.getValue('location')}</span>
      ),
    },

    // ─────────────────────────────────────────────────────────────
    // DATE COLUMN (sortable)
    // ─────────────────────────────────────────────────────────────
    {
      accessorKey: 'submitted_on',
      /**
       * Sortable header pattern:
       * - We wrap the header in a button
       * - column.getIsSorted() returns 'asc', 'desc', or false
       * - column.toggleSorting() cycles through sort states
       */
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className='-ml-4'
          >
            Date Added
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue('submitted_on') as string | null;
        if (!date) return <span className='text-gray-400'>—</span>;

        return (
          <span className='text-gray-600'>
            {format(new Date(date), 'MMM d, yyyy')}
          </span>
        );
      },
      /**
       * Default sort: most recent first
       * This is set at the table level, not here
       */
    },
  ];
}
