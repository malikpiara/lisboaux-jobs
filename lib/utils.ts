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

// ─────────────────────────────────────────────────────────────────
// URL Cleaning Utilities
//
// Strips tracking parameters (UTM, click IDs, etc.) from job URLs
// so we store clean, canonical links in the database.
// ─────────────────────────────────────────────────────────────────

const TRACKING_PARAM_PATTERNS = [
  /^utm_/,
  /^ref$/,
  /^fbclid$/,
  /^gclid$/,
  /^gad_source$/,
  /^msclkid$/,
  /^twclid$/,
  /^li_fat_id$/,
  /^mc_eid$/,
  /^oly_enc_id$/,
  /^_hsenc$/,
  /^_hsmi$/,
  /^vero_id$/,
  /^mkt_tok$/,
];

const isTrackingParam = (key: string) =>
  TRACKING_PARAM_PATTERNS.some((pattern) => pattern.test(key));

export function cleanTrackingParams(inputUrl: string): string {
  try {
    const parsed = new URL(inputUrl);
    const paramsToDelete: string[] = [];

    parsed.searchParams.forEach((_, key) => {
      if (isTrackingParam(key)) {
        paramsToDelete.push(key);
      }
    });

    paramsToDelete.forEach((key) => parsed.searchParams.delete(key));

    return parsed.toString();
  } catch {
    return inputUrl;
  }
}

export function hasQueryParams(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.size > 0;
  } catch {
    return false;
  }
}

export function removeAllQueryParams(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = '';
    return parsed.toString();
  } catch {
    return url;
  }
}
