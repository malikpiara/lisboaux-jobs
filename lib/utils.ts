import { formatDistanceToNow } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const buildJobUrl = (baseUrl: string) => {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', 'LisboaUX');
  return url.toString();
};

export const formatRelativeDate = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
