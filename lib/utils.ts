import { formatDistanceToNow } from 'date-fns';

export const buildJobUrl = (baseUrl: string) => {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', 'LisboaUX');
  return url.toString();
};

export const formatRelativeDate = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};
