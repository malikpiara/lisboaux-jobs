'use client';

/**
 * JobsDataTable Component
 *
 * This is where TanStack Table's power becomes visible.
 * The library provides hooks that manage:
 * - Sorting state
 * - Filtering state
 * - Pagination state
 * - Row selection (not used here, but available)
 *
 * MENTAL MODEL:
 * ┌──────────────────────────────────────────────────────────┐
 * │  Your Data (jobs array)                                  │
 * │              │                                           │
 * │              ▼                                           │
 * │  ┌─────────────────────────────────────────────────┐    │
 * │  │  TanStack Table                                 │    │
 * │  │  - Applies filters                              │    │
 * │  │  - Applies sorting                              │    │
 * │  │  - Slices for pagination                        │    │
 * │  └─────────────────────────────────────────────────┘    │
 * │              │                                           │
 * │              ▼                                           │
 * │  Processed rows (what you render)                        │
 * └──────────────────────────────────────────────────────────┘
 *
 * The table instance gives you methods like:
 * - table.getRowModel().rows → the rows to render
 * - table.getHeaderGroups() → header structure
 * - table.getCanNextPage() → pagination state
 */

import { useState } from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

export function JobsDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  /**
   * State for table features
   *
   * TanStack Table can manage this state internally, but by lifting it
   * to React state, we can:
   * - Persist it across re-renders
   * - Control it programmatically
   * - Sync it with URL params (advanced)
   */
  const [sorting, setSorting] = useState<SortingState>([
    // Default sort: most recent first
    { id: 'submitted_on', desc: true },
  ]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  /**
   * Global filter is separate from column filters.
   * It searches across all columns (or specified ones).
   */
  const [globalFilter, setGlobalFilter] = useState('');

  /**
   * useReactTable is the main hook.
   *
   * It takes:
   * - data: your array of items
   * - columns: column definitions
   * - state: current state values
   * - onStateChange: handlers for state updates
   * - get*RowModel: plugins that add features
   *
   * Each get*RowModel adds a capability:
   * - getCoreRowModel: required, basic row handling
   * - getSortedRowModel: enables sorting
   * - getFilteredRowModel: enables filtering
   * - getPaginationRowModel: enables pagination
   */
  const table = useReactTable({
    data,
    columns,
    // State
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    // State handlers
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    // Feature plugins
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Pagination settings
    initialState: {
      pagination: {
        pageSize: 30,
      },
    },
    /**
     * Global filter function
     * This determines which columns are searched when using globalFilter
     */
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();

      // Search in title, company, and location
      const title = (row.getValue('title') as string)?.toLowerCase() ?? '';
      const company = (row.getValue('company') as string)?.toLowerCase() ?? '';
      const location =
        (row.getValue('location') as string)?.toLowerCase() ?? '';

      return (
        title.includes(searchValue) ||
        company.includes(searchValue) ||
        location.includes(searchValue)
      );
    },
  });

  return (
    <div className='space-y-4'>
      {/* ─────────────────────────────────────────────────────────── */}
      {/* SEARCH BAR */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className='flex items-center gap-2'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            placeholder='Search jobs, companies, locations...'
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className='pl-9 bg-muted'
          />
        </div>
        <span className='text-sm text-gray-500'>
          {table.getFilteredRowModel().rows.length} jobs
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TABLE */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {/**
             * getHeaderGroups() returns an array for multi-level headers.
             * For simple tables, there's usually just one group.
             */}
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : /**
                         * flexRender is TanStack's way of rendering
                         * either a string or a React component.
                         * It handles the "header can be a function" pattern.
                         */
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='bg-card'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No jobs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* PAGINATION */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className='flex items-center justify-between'>
        <p className='text-sm text-gray-500'>
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </p>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
