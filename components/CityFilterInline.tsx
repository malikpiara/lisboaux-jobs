'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TransitionLink as Link } from '@/components/TransitionLink';
import { useNavTransition } from '@/components/NavigationTransition';
import { Check } from 'lucide-react';

type CityOption = {
  name: string;
  count: number;
};

type CityFilterInlineProps = {
  currentCity: string;
  cities: CityOption[];
};

export function CityFilterInline({
  currentCity,
  cities,
}: CityFilterInlineProps) {
  const [open, setOpen] = useState(false);
  const { navigate } = useNavTransition();

  const handleCitySelect = (cityName: string) => {
    setOpen(false);
    const slug = cityName.toLowerCase().replace(/\s+/g, '-');
    // Uses the shared navigate() which wraps router.push in
    // startTransition — so isNavigating becomes true and the
    // blur/fade exit animation triggers, just like TransitionLink.
    navigate(`/location/${slug}`);
  };

  return (
    <span className='inline-flex items-baseline gap-1.5'>
      {/* City name — click to open picker */}
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
                onClick={() => handleCitySelect(name)}
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

      {/* × — click to clear filter entirely */}
      <Link
        href='/'
        className='opacity-30 hover:opacity-100 transition-opacity text-muted-foreground'
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
      </Link>
    </span>
  );
}
