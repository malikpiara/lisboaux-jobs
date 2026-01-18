import { Job } from '@/lib/types';

/**
 * Generates JSON-LD structured data for job postings.
 *
 * JSON-LD (JavaScript Object Notation for Linked Data) is a format that
 * search engines use to understand your content. It's embedded in a <script>
 * tag and is invisible to users.
 *
 * Schema.org is the vocabulary we use - it's a collaborative project by
 * Google, Microsoft, Yahoo, and Yandex to create a shared set of definitions.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/job-posting
 * @see https://schema.org/JobPosting
 */
export function generateJobPostingSchema(jobs: Job[]) {
  // Filter to only active jobs (same as your JobList component)
  const activeJobs = jobs.filter((job) => job.is_active);

  // Schema for your website itself
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LisboaUX Jobs',
    url: 'https://jobs.lisboaux.com',
    description: 'Find UX design and digital product design jobs in Portugal.',
  };

  // Schema for each job posting
  // Note: Since you link OUT to jobs (not hosting them), we include what we know
  // and use the original URL as the target
  const jobPostingSchemas = activeJobs.map((job) => ({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',

    // Required fields
    title: job.title,
    description: `${job.title} position at ${job.company} in ${job.location}`,
    datePosted: job.submitted_on, // ISO 8601 format (e.g., "2025-01-18")

    // Hiring organization
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },

    // Job location
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressCountry: 'PT', // Portugal
      },
    },

    // Since you're an aggregator linking to external jobs,
    // this points to the original job posting
    url: job.url,

    // Optional but recommended fields you could add later:
    // employmentType: 'FULL_TIME', // FULL_TIME, PART_TIME, CONTRACT, etc.
    // salary: { '@type': 'MonetaryAmount', currency: 'EUR', value: { '@type': 'QuantitativeValue', value: 50000 } },
    // validThrough: '2025-02-18', // When the posting expires
  }));

  // Combine all schemas into a single array
  return [websiteSchema, ...jobPostingSchemas];
}
