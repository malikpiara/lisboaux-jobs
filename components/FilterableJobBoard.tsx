'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Job } from '@/lib/types';
import { JobList } from '@/components/JobList';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check } from 'lucide-react';

// ─── FILTER TYPES ───────────────────────────────────────────
type Filter =
  | { type: 'none' }
  | { type: 'location'; value: string }
  | { type: 'company'; value: string };

interface FilterableJobBoardProps {
  allJobs: Job[];
  initialFilter: Filter;
  cities: { name: string; count: number }[];
}

// ─── SLUG HELPERS ───────────────────────────────────────────
function toSlug(value: string): string {
  return encodeURIComponent(value.trim().toLowerCase().replace(/\s+/g, '-'));
}

function fromSlug(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, ' ');
}

function filtersEqual(a: Filter, b: Filter): boolean {
  if (a.type !== b.type) return false;
  if (a.type === 'none') return true;
  return (
    (a as { value: string }).value.toLowerCase() ===
    (b as { value: string }).value.toLowerCase()
  );
}

function parseFilterFromPath(pathname: string): Filter {
  const locationMatch = pathname.match(/^\/location\/(.+)$/);
  if (locationMatch) {
    return { type: 'location', value: fromSlug(locationMatch[1]) };
  }

  const companyMatch = pathname.match(/^\/company\/(.+)$/);
  if (companyMatch) {
    return { type: 'company', value: fromSlug(companyMatch[1]) };
  }

  return { type: 'none' };
}

// ─── EASING ─────────────────────────────────────────────────
const EASE_OUT = 'cubic-bezier(0.165, 0.84, 0.44, 1)';

// ─── COMPONENT ──────────────────────────────────────────────
export function FilterableJobBoard({
  allJobs,
  initialFilter,
  cities,
}: FilterableJobBoardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pendingFilterRef = useRef<Filter | null>(null);

  // ─── REDUCED MOTION ─────────────────────────────────────
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ─── URL → FILTER SYNC (browser back/forward) ──────────
  useEffect(() => {
    if (pendingFilterRef.current) return;

    const newFilter = parseFilterFromPath(pathname);
    if (!filtersEqual(newFilter, filter)) {
      setFilter(newFilter);
    }
  }, [pathname]);

  // ─── FILTERED JOBS ──────────────────────────────────────
  const activeJobs = useMemo(
    () => allJobs.filter((job) => job.is_active),
    [allJobs],
  );

  const filteredJobs = useMemo(() => {
    switch (filter.type) {
      case 'location':
        return activeJobs.filter(
          (job) => job.location.toLowerCase() === filter.value.toLowerCase(),
        );
      case 'company':
        return activeJobs.filter(
          (job) => job.company.toLowerCase() === filter.value.toLowerCase(),
        );
      case 'none':
      default:
        return activeJobs;
    }
  }, [activeJobs, filter]);

  // ─── DISPLAY NAME ───────────────────────────────────────
  const displayName = useMemo(() => {
    if (filter.type === 'none') return null;

    if (filter.type === 'location' && filteredJobs.length > 0) {
      return filteredJobs[0].location;
    }
    if (filter.type === 'company' && filteredJobs.length > 0) {
      return filteredJobs[0].company;
    }

    return filter.value.replace(/\b\w/g, (c) => c.toUpperCase());
  }, [filter, filteredJobs]);

  // ─── FILTER CHANGE WITH TRANSITION ─────────────────────
  const applyFilter = useCallback(
    (newFilter: Filter) => {
      if (filtersEqual(newFilter, filter)) return;

      pendingFilterRef.current = newFilter;
      setIsTransitioning(true);

      const delay = reducedMotion ? 0 : 150;

      setTimeout(() => {
        setFilter(newFilter);
        setIsTransitioning(false);
        pendingFilterRef.current = null;

        let newPath: string;
        switch (newFilter.type) {
          case 'location':
            newPath = `/location/${toSlug(newFilter.value)}`;
            break;
          case 'company':
            newPath = `/company/${toSlug(newFilter.value)}`;
            break;
          default:
            newPath = '/';
        }

        router.push(newPath, { scroll: false });
      }, delay);
    },
    [filter, router, reducedMotion],
  );

  // ─── NAVIGATION HANDLERS ───────────────────────────────
  const navigateToLocation = useCallback(
    (cityName: string) => {
      applyFilter({ type: 'location', value: cityName });
    },
    [applyFilter],
  );

  const navigateToCompany = useCallback(
    (companyName: string) => {
      applyFilter({ type: 'company', value: companyName });
    },
    [applyFilter],
  );

  const clearFilter = useCallback(() => {
    applyFilter({ type: 'none' });
  }, [applyFilter]);

  // ─── SOURCE PAGE TYPE ──────────────────────────────────
  const sourcePageType =
    filter.type === 'location'
      ? 'location'
      : filter.type === 'company'
        ? 'company'
        : 'homepage';

  // ─── TRANSITION STYLE ─────────────────────────────────
  const transitionStyle = reducedMotion
    ? {}
    : {
        opacity: isTransitioning ? 0.5 : 1,
        filter: isTransitioning ? 'blur(2px)' : 'blur(0px)',
        transition: isTransitioning
          ? `opacity 150ms ${EASE_OUT}, filter 150ms ${EASE_OUT}`
          : `opacity 250ms ${EASE_OUT}, filter 250ms ${EASE_OUT}`,
      };

  return (
    <div style={transitionStyle} className='w-full'>
      {/* ─── CONTEXT BAR ─────────────────────────────────── */}
      {filter.type === 'none' && <div />}

      {filter.type === 'location' && (
        <div className='w-full flex items-center justify-between py-4 px-2'>
          <h1 className='text-lg font-semibold text-foreground'>
            Design Jobs in{' '}
            <CityPickerInline
              currentCity={displayName!}
              cities={cities}
              onCitySelect={navigateToLocation}
              onClear={clearFilter}
            />
          </h1>
          <p className='text-sm text-muted-foreground'>
            {filteredJobs.length} active{' '}
            {filteredJobs.length === 1 ? 'job' : 'jobs'}
          </p>
        </div>
      )}

      {filter.type === 'company' && (
        <div className='w-full flex items-center justify-between py-4 px-2'>
          <h1 className='text-lg font-semibold text-foreground'>
            Design Jobs at{' '}
            <span className='inline-flex items-baseline gap-1.5'>
              <span className='text-primary border-b border-dashed border-primary/60'>
                {displayName}
              </span>
              <button
                onClick={clearFilter}
                className='opacity-30 hover:opacity-100 transition-opacity text-muted-foreground cursor-pointer'
                aria-label={`Clear ${displayName} filter`}
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
              </button>
            </span>
          </h1>
          <p className='text-sm text-muted-foreground'>
            {filteredJobs.length} active{' '}
            {filteredJobs.length === 1 ? 'job' : 'jobs'}
          </p>
        </div>
      )}

      {/* ─── JOB LIST ────────────────────────────────────── */}
      <main className='w-full bg-background rounded-b-sm'>
        <JobList
          jobs={filteredJobs}
          sourcePageType={sourcePageType}
          onCompanyClick={navigateToCompany}
          onLocationClick={navigateToLocation}
        />
      </main>
    </div>
  );
}

// ─── CITY PICKER (inline) ───────────────────────────────────
function CityPickerInline({
  currentCity,
  cities,
  onCitySelect,
  onClear,
}: {
  currentCity: string;
  cities: { name: string; count: number }[];
  onCitySelect: (cityName: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className='inline-flex items-baseline gap-1.5'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className='inline-flex items-baseline gap-0.5 transition-colors group cursor-pointer'>
            <span className='text-primary border-b border-dashed border-primary/60 group-hover:border-solid transition-all'>
              {currentCity}
            </span>
            <svg
              className={`w-3 h-3 text-primary opacity-40 group-hover:opacity-80 transition-all relative top-0.5 ${
                open ? 'rotate-180 opacity-80' : ''
              }`}
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2.5}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </button>
        </PopoverTrigger>
        <PopoverContent className='w-44 p-1' align='start' sideOffset={8}>
          {cities.map(({ name, count }) => {
            const isActive = name.toLowerCase() === currentCity.toLowerCase();
            return (
              <button
                key={name}
                onClick={() => {
                  setOpen(false);
                  onCitySelect(name);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between rounded-sm transition-colors ${
                  isActive
                    ? 'text-primary font-semibold bg-primary/5'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span className='flex items-center gap-2'>
                  {isActive ? (
                    <Check className='w-3.5 h-3.5 flex-shrink-0 text-primary' />
                  ) : (
                    <span className='w-3.5' />
                  )}
                  {name}
                </span>
                <span className='text-xs text-muted-foreground'>{count}</span>
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      <button
        onClick={onClear}
        className='opacity-30 hover:opacity-100 transition-opacity text-muted-foreground cursor-pointer'
        aria-label={`Clear ${currentCity} filter`}
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
      </button>
    </span>
  );
}
