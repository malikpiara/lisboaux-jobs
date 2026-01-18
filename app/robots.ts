import type { MetadataRoute } from 'next';

/**
 * Generates the robots.txt file for the site.
 *
 * This tells search engine crawlers:
 * 1. What paths they can/cannot access
 *
 * Next.js automatically serves this at /robots.txt
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    // Add sitemap later when you have multiple pages:
    // sitemap: 'https://jobs.lisboaux.com/sitemap.xml',
  };
}
