import * as Sentry from "@sentry/nextjs";

// Server-side errors (API routes, generation stages) land in Sentry.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});

