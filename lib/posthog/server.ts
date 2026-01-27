import { PostHog } from 'posthog-node';

/**
 * Server-side PostHog client
 *
 * Use this for tracking events from:
 * - Server Actions
 * - Route Handlers
 * - Server Components (rare)
 *
 * The client-side PostHog (in PostHogProvider) handles browser events.
 * This handles server-side events that need to be attributed to users.
 */

let posthogClient: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    console.warn('PostHog API key not found. Server-side tracking disabled.');
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      // Flush events immediately in serverless environments
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}

/**
 * Track a server-side event
 *
 * @param userId - The user's ID (from profiles.id)
 * @param event - Event name (e.g., 'job_added', 'job_deactivated')
 * @param properties - Additional event properties
 */
export function captureServerEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const posthog = getPostHogServer();

  if (!posthog) {
    return;
  }

  posthog.capture({
    distinctId: userId,
    event,
    properties: {
      ...properties,
      $source: 'server',
    },
  });
}

/**
 * Shutdown PostHog client (call in API route cleanup if needed)
 */
export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
