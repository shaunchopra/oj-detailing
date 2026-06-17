import { PostHog } from 'posthog-node';

const apiKey = process.env['POSTHOG_API_KEY'] ?? '';
const host = process.env['POSTHOG_HOST'] ?? '';

export const posthog = new PostHog(apiKey, {
  host,
  // Serverless: flush immediately on every event
  flushAt: 1,
  flushInterval: 0,
  enableExceptionAutocapture: true,
  disabled: !apiKey,
});
